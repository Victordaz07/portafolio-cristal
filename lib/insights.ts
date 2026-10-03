import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Prisma } from "@prisma/client";
import { prismaRoot } from "./prisma-root";
import { AI_MODEL, getAiClient, isAiConfigured } from "./ai";
import { engagementRate } from "./metrics";
import { HEATMAP_DAYS, HEATMAP_SLOTS } from "./reports";
import { appTimeZone } from "./growth-server";
import { MIN_VIEWS, median, nicheOf } from "./platform-analytics";

// ─── Inteligencia Foliocrew ───
// Cada día se calcula, por nicho, qué funciona y qué no con los resultados reales de las cuentas que
// aceptaron participar (Creator.shareInsights). Es agregado y anónimo:
//   - solo grupos con al menos MIN_CREATORS cuentas y MIN_POSTS publicaciones medidas;
//   - a Claude se le mandan fragmentos de captions sin @usuarios, enlaces ni nombres de cuenta o marca;
//   - nada identifica a una persona en lo que se muestra a las demás.
// Lo aprendido se guarda en NicheInsight y se usa en las sugerencias de IA y en la tarjeta
// "Lo que funciona en tu nicho" de quienes participan.

export const MIN_CREATORS = 3;
export const MIN_POSTS = 10;

export interface InsightStats {
  medianEr: number | null;
  medianViews: number | null;
  bestSlots: { day: string; slot: string; median: number; count: number }[];
  worstSlots: { day: string; slot: string; median: number; count: number }[];
  byType: { key: string; medianEr: number; posts: number }[];
  byPlatform: { key: string; medianEr: number; posts: number }[];
  collab: { key: string; medianEr: number; posts: number }[];
  captionLength: { key: string; medianEr: number; posts: number }[];
  medianDeal: number | null;
  deals: number;
}

const PlaybookSchema = z.object({
  summary: z.string().describe("Resumen en 2 frases de lo que muestran los datos de este nicho"),
  whatWorks: z.array(z.string()).describe("3 a 5 patrones que se repiten en las publicaciones con mejor engagement"),
  whatDoesnt: z.array(z.string()).describe("2 a 4 patrones que se repiten en las de peor engagement"),
  hooks: z.array(z.string()).describe("3 a 5 tipos de gancho que funcionan, explicados (no copies captions)"),
  recommendations: z.array(z.string()).describe("3 a 5 recomendaciones concretas y accionables para crear el próximo contenido"),
});
export type Playbook = z.infer<typeof PlaybookSchema>;

/** Quita lo que podría identificar a alguien: @usuarios, enlaces, correos y hashtags de marca muy largos. */
export function anonymizeCaption(text: string) {
  return text
    .replace(/https?:\/\/\S+/g, "[enlace]")
    .replace(/\S+@\S+\.\S+/g, "[correo]")
    .replace(/@[\w.]+/g, "@cuenta")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function slotOf(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(date);
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.find((p) => p.type === "weekday")!.value);
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  const h = hour < 6 ? hour + 24 : hour;
  return { day, slot: HEATMAP_SLOTS.findIndex((s) => h >= s.from && h < s.to) };
}

type Post = {
  creatorId: string;
  platform: string;
  type: string;
  caption: string;
  views: number;
  er: number;
  postedAt: Date | null;
  collab: boolean;
  slotLabel: string | null;
};

function grouped(posts: Post[], keyOf: (p: Post) => string) {
  const map = new Map<string, number[]>();
  for (const p of posts) map.set(keyOf(p), [...(map.get(keyOf(p)) ?? []), p.er]);
  return Array.from(map.entries())
    .map(([key, ers]) => ({ key, medianEr: median(ers) ?? 0, posts: ers.length }))
    .sort((a, b) => b.medianEr - a.medianEr);
}

function computeStats(posts: Post[], deals: number[]): InsightStats {
  const tz = appTimeZone();
  const cells = new Map<string, number[]>();
  for (const p of posts) {
    if (!p.postedAt) continue;
    const { day, slot } = slotOf(p.postedAt, tz);
    if (day < 0 || slot < 0) continue;
    const key = `${day}|${slot}`;
    cells.set(key, [...(cells.get(key) ?? []), p.er]);
  }
  const slots = Array.from(cells.entries())
    .filter(([, ers]) => ers.length >= 2)
    .map(([key, ers]) => {
      const [d, s] = key.split("|").map(Number);
      return { day: HEATMAP_DAYS[d], slot: HEATMAP_SLOTS[s].label, median: median(ers)!, count: ers.length };
    })
    .sort((a, b) => b.median - a.median);
  return {
    medianEr: median(posts.map((p) => p.er)),
    medianViews: median(posts.map((p) => p.views)),
    bestSlots: slots.slice(0, 3),
    worstSlots: slots.length > 3 ? slots.slice(-2).reverse() : [],
    byType: grouped(posts, (p) => (p.type === "photo" ? "Foto" : "Video")),
    byPlatform: grouped(posts, (p) => p.platform),
    collab: grouped(posts, (p) => (p.collab ? "Con marca" : "Orgánico")),
    captionLength: grouped(posts, (p) => (p.caption.length < 80 ? "Corto (<80)" : p.caption.length < 200 ? "Medio (80–200)" : "Largo (200+)")),
    medianDeal: median(deals),
    deals: deals.length,
  };
}

async function writePlaybook(label: string, posts: Post[], stats: InsightStats): Promise<Playbook | null> {
  if (!isAiConfigured()) return null;
  const sorted = [...posts].sort((a, b) => b.er - a.er);
  const describe = (p: Post) =>
    `- ${p.er}% engagement · ${p.views} vistas · ${p.platform} · ${p.type === "photo" ? "foto" : "video"} · ${p.collab ? "con marca" : "orgánico"}${p.slotLabel ? ` · ${p.slotLabel}` : ""}\n  "${anonymizeCaption(p.caption)}"`;
  const best = sorted.slice(0, 12).map(describe).join("\n");
  const worst = sorted.slice(-8).map(describe).join("\n");
  const response = await getAiClient().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 6000,
    output_config: { effort: "medium", format: betaZodOutputFormat(PlaybookSchema) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `Eres analista de contenido de Foliocrew, una plataforma para creadores de contenido UGC.
Analizas resultados reales y anónimos de un nicho y explicas qué funciona, en español neutro, claro y concreto.
Básate solo en los datos: si una conclusión tiene pocas publicaciones detrás, dilo. No inventes cifras.
No copies captions ni menciones marcas o personas: describe patrones (tipo de gancho, estructura, tono, duración, llamada a la acción).`,
    messages: [
      {
        role: "user",
        content: `Nicho: ${label}. ${posts.length} publicaciones medidas de ${new Set(posts.map((p) => p.creatorId)).size} cuentas.
Estadísticas: ${JSON.stringify(stats)}

Publicaciones con MEJOR engagement:
${best}

Publicaciones con PEOR engagement:
${worst}

Escribe el playbook de este nicho: qué funciona, qué no, ganchos que funcionan y recomendaciones para el próximo contenido.`,
      },
    ],
  });
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}

/** Recalcula la inteligencia de todos los nichos (y la global). Devuelve qué grupos se actualizaron. */
export async function refreshInsights({ withAi = true } = {}) {
  const [creators, cards, deals] = await Promise.all([
    prismaRoot.creator.findMany({ where: { shareInsights: true, status: "active" }, select: { id: true, hero: { select: { niche: true } } } }),
    prismaRoot.contentCard.findMany({
      // YouTube queda fuera: sus datos solo se usan para la propia cuenta (uso limitado de las APIs de Google).
      where: { views: { gte: MIN_VIEWS }, platform: { not: "youtube" }, creator: { shareInsights: true, status: "active" } },
      select: { creatorId: true, platform: true, type: true, caption: true, views: true, likes: true, comments: true, shares: true, saves: true, postedAt: true, brandId: true },
    }),
    prismaRoot.brand.findMany({
      where: { dealValue: { gt: 0 }, creator: { shareInsights: true } },
      select: { creatorId: true, dealValue: true },
    }),
  ]);
  const tz = appTimeZone();
  const nicheByCreator = new Map(creators.map((c) => [c.id, nicheOf(c.hero?.niche)]));
  const posts: (Post & { niche: string })[] = cards.flatMap((c) => {
    const er = engagementRate(c);
    const niche = nicheByCreator.get(c.creatorId);
    if (er == null || !niche) return [];
    const slot = c.postedAt ? slotOf(c.postedAt, tz) : null;
    return [
      {
        creatorId: c.creatorId,
        platform: c.platform,
        type: c.type,
        caption: c.caption,
        views: c.views ?? 0,
        er,
        postedAt: c.postedAt,
        collab: Boolean(c.brandId),
        slotLabel: slot && slot.day >= 0 && slot.slot >= 0 ? `${HEATMAP_DAYS[slot.day]} ${HEATMAP_SLOTS[slot.slot].label.toLowerCase()}` : null,
        niche: niche.id,
      },
    ];
  });

  const groups: { id: string; label: string; posts: typeof posts }[] = [{ id: "global", label: "Todos los nichos", posts }];
  for (const id of Array.from(new Set(posts.map((p) => p.niche)))) {
    const label = Array.from(nicheByCreator.values()).find((n) => n.id === id)!.label;
    groups.push({ id, label, posts: posts.filter((p) => p.niche === id) });
  }

  const updated: string[] = [];
  for (const g of groups) {
    const creatorsInGroup = new Set(g.posts.map((p) => p.creatorId)).size;
    if (creatorsInGroup < MIN_CREATORS || g.posts.length < MIN_POSTS) {
      // Si un grupo deja de cumplir el mínimo (alguien dejó de participar), se borra lo aprendido.
      await prismaRoot.nicheInsight.deleteMany({ where: { niche: g.id } });
      continue;
    }
    const groupDeals = deals.filter((d) => (g.id === "global" ? true : nicheByCreator.get(d.creatorId)?.id === g.id)).map((d) => d.dealValue ?? 0);
    const stats = computeStats(g.posts, groupDeals);
    let playbook: Playbook | null = null;
    if (withAi) {
      try {
        playbook = await writePlaybook(g.label, g.posts, stats);
      } catch (error) {
        console.error(`No se pudo escribir el playbook de ${g.label}`, error);
      }
    }
    const data = {
      label: g.label,
      creators: creatorsInGroup,
      posts: g.posts.length,
      stats: stats as unknown as Prisma.InputJsonValue,
      // Si Claude no respondió hoy, se conserva el playbook anterior.
      ...(playbook ? { playbook: playbook as unknown as Prisma.InputJsonValue } : {}),
      generatedAt: new Date(),
    };
    await prismaRoot.nicheInsight.upsert({ where: { niche: g.id }, create: { niche: g.id, ...data }, update: data });
    updated.push(g.id);
  }
  return { updated, participants: creators.length, posts: posts.length };
}

/** La inteligencia que aplica a una cuenta: la de su nicho o, si todavía no hay, la global. */
export async function insightForNiche(nicheLabel: string | null | undefined) {
  const niche = nicheOf(nicheLabel);
  const rows = await prismaRoot.nicheInsight.findMany({ where: { niche: { in: [niche.id, "global"] } } });
  const row = rows.find((r) => r.niche === niche.id) ?? rows.find((r) => r.niche === "global") ?? null;
  if (!row) return null;
  return { ...row, stats: row.stats as unknown as InsightStats, playbook: (row.playbook as unknown as Playbook | null) ?? null, isOwnNiche: row.niche === niche.id };
}

/** Texto breve para las sugerencias de IA (solo para cuentas que participan). */
export function insightPromptText(insight: NonNullable<Awaited<ReturnType<typeof insightForNiche>>>) {
  const s = insight.stats;
  const lines = [
    `Datos reales y anónimos de Foliocrew (${insight.label}, ${insight.creators} cuentas, ${insight.posts} publicaciones):`,
    s.medianEr != null ? `- Engagement mediano: ${s.medianEr}%.` : "",
    s.bestSlots.length ? `- Mejores franjas: ${s.bestSlots.map((b) => `${b.day} ${b.slot.toLowerCase()} (${b.median}%)`).join(", ")}.` : "",
    s.byType.length > 1 ? `- Formato con más engagement: ${s.byType[0].key} (${s.byType[0].medianEr}%).` : "",
    s.captionLength.length > 1 ? `- Largo de caption que mejor funciona: ${s.captionLength[0].key}.` : "",
    ...(insight.playbook ? [`- Funciona: ${insight.playbook.whatWorks.slice(0, 3).join(" · ")}`, `- Evitar: ${insight.playbook.whatDoesnt.slice(0, 2).join(" · ")}`] : []),
  ];
  return lines.filter(Boolean).join("\n");
}
