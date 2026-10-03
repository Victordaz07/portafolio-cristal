import { prismaRoot } from "@/lib/prisma-root";
import { MIN_CREATORS, MIN_POSTS, type InsightStats, type Playbook } from "@/lib/insights";
import { MIN_VIEWS, nicheOf } from "@/lib/platform-analytics";
import { isAiConfigured } from "@/lib/ai";
import { NETWORK_META } from "@/lib/content-plan";
import Card from "@/components/admin/Card";
import RefreshInsightsButton from "./RefreshInsightsButton";
import { Stat, eyebrowClass } from "./charts";

const networkLabel = (key: string) => (key in NETWORK_META ? NETWORK_META[key as keyof typeof NETWORK_META].label : key);
const fmt = (d: Date) => d.toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Pestaña "Inteligencia": lo que Foliocrew aprende de los resultados reales, por nicho. */
export default async function IntelligenceSection() {
  const [insights, creators, posts] = await Promise.all([
    prismaRoot.nicheInsight.findMany({ orderBy: [{ creators: "desc" }] }),
    prismaRoot.creator.findMany({ where: { status: "active" }, select: { id: true, shareInsights: true, hero: { select: { niche: true } } } }),
    prismaRoot.contentCard.groupBy({ by: ["creatorId"], where: { views: { gte: MIN_VIEWS }, platform: { not: "youtube" }, creator: { shareInsights: true, status: "active" } }, _count: { _all: true } }),
  ]);
  const participants = creators.filter((c) => c.shareInsights);
  const postsByCreator = new Map(posts.map((p) => [p.creatorId, p._count._all]));
  // Progreso de cada nicho hacia el mínimo para aprender de él.
  const progress = new Map<string, { label: string; creators: number; posts: number }>();
  for (const c of participants) {
    const n = nicheOf(c.hero?.niche);
    const row = progress.get(n.id) ?? { label: n.label, creators: 0, posts: 0 };
    row.creators += 1;
    row.posts += postsByCreator.get(c.id) ?? 0;
    progress.set(n.id, row);
  }
  const global = insights.find((i) => i.niche === "global");
  const niches = insights.filter((i) => i.niche !== "global");

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-sp-3">
          <div className="max-w-3xl">
            <p className={`${eyebrowClass} mb-sp-1`}>Inteligencia Foliocrew</p>
            <p className="text-sm text-ink/75">
              Cada día Foliocrew analiza los resultados reales de las cuentas que aceptaron participar: qué formatos, horarios, largos de
              caption y ganchos funcionan en cada nicho. Claude escribe un playbook por nicho y ese aprendizaje se usa en las sugerencias de IA
              y en la tarjeta &quot;Lo que funciona en tu nicho&quot; de quienes participan.
            </p>
            <p className="mt-sp-2 text-xs text-ink/55">
              Reglas de privacidad: solo cuentas que dieron su permiso · se aprende de un nicho cuando hay al menos {MIN_CREATORS} cuentas y{" "}
              {MIN_POSTS} publicaciones con {MIN_VIEWS}+ vistas · a Claude no se le mandan nombres, @usuarios, marcas ni enlaces · nadie ve datos de
              otra persona.
            </p>
          </div>
          <RefreshInsightsButton aiReady={isAiConfigured()} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Stat value={`${participants.length}/${creators.length}`} label="Cuentas que participan" />
        <Stat value={posts.filter((p) => participants.some((c) => c.id === p.creatorId)).reduce((s, p) => s + p._count._all, 0)} label="Publicaciones que aportan" />
        <Stat value={niches.length} label="Nichos con aprendizaje" />
        <Stat value={global ? fmt(global.generatedAt) : "—"} label="Último análisis" />
      </div>

      {insights.length === 0 && (
        <Card>
          <p className="text-sm text-ink">
            Todavía no hay suficientes datos para aprender. Hacen falta al menos <strong>{MIN_CREATORS} cuentas</strong> que participen y{" "}
            <strong>{MIN_POSTS} publicaciones</strong> con métricas en un mismo grupo.
          </p>
          {progress.size > 0 && (
            <ul className="mt-sp-3 flex flex-col gap-1 text-sm text-ink/70">
              {Array.from(progress.values()).map((p) => (
                <li key={p.label}>
                  {p.label}: {p.creators}/{MIN_CREATORS} cuentas · {p.posts}/{MIN_POSTS} publicaciones
                </li>
              ))}
            </ul>
          )}
          <p className="mt-sp-3 text-xs text-ink/55">
            Cada cuenta ve la invitación a participar en Reportes y en Mi cuenta. Mientras más cuentas participen, mejores son las recomendaciones para todas.
          </p>
        </Card>
      )}

      {[...(global ? [global] : []), ...niches].map((i) => {
        const s = i.stats as unknown as InsightStats;
        const pb = i.playbook as unknown as Playbook | null;
        return (
          <Card key={i.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-sp-2">
              <p className="font-fraunces text-2xl font-semibold text-ink">{i.label}</p>
              <p className="text-xs text-ink/55">
                {i.creators} cuentas · {i.posts} publicaciones · actualizado {fmt(i.generatedAt)}
              </p>
            </div>
            <div className="mt-sp-3 grid gap-sp-4 lg:grid-cols-2">
              <div className="flex flex-col gap-sp-2 text-sm text-ink">
                <p>
                  Engagement mediano <strong>{s.medianEr ?? "—"}%</strong> · vistas medianas <strong>{s.medianViews?.toLocaleString("es") ?? "—"}</strong>
                  {s.medianDeal != null && (
                    <>
                      {" "}
                      · precio mediano por trato <strong>US${s.medianDeal}</strong> ({s.deals})
                    </>
                  )}
                </p>
                {s.bestSlots.length > 0 && (
                  <p>
                    🕒 Mejores franjas: {s.bestSlots.map((b) => `${b.day} ${b.slot.toLowerCase()} (${b.median}%)`).join(" · ")}
                    {s.worstSlots.length > 0 && <span className="text-ink/55"> · peores: {s.worstSlots.map((b) => `${b.day} ${b.slot.toLowerCase()}`).join(", ")}</span>}
                  </p>
                )}
                <p>🎬 Formato: {s.byType.map((t) => `${t.key} ${t.medianEr}% (${t.posts})`).join(" · ")}</p>
                <p>📱 Red: {s.byPlatform.map((t) => `${networkLabel(t.key)} ${t.medianEr}% (${t.posts})`).join(" · ")}</p>
                <p>✍️ Caption: {s.captionLength.map((t) => `${t.key} ${t.medianEr}%`).join(" · ")}</p>
                <p>🤝 {s.collab.map((t) => `${t.key} ${t.medianEr}% (${t.posts})`).join(" · ")}</p>
              </div>
              {pb ? (
                <div className="rounded-[14px] bg-cream p-sp-4 text-sm text-ink">
                  <p className="font-semibold">{pb.summary}</p>
                  <PlaybookList title="✅ Lo que funciona" items={pb.whatWorks} />
                  <PlaybookList title="❌ Lo que no" items={pb.whatDoesnt} />
                  <PlaybookList title="🪝 Ganchos" items={pb.hooks} />
                  <PlaybookList title="🎯 Recomendaciones" items={pb.recommendations} />
                </div>
              ) : (
                <p className="rounded-[14px] bg-cream p-sp-4 text-sm text-ink/65">
                  {isAiConfigured() ? "El análisis de Claude se escribe en el próximo cálculo." : "Falta ANTHROPIC_API_KEY para que Claude escriba el análisis."}
                </p>
              )}
            </div>
          </Card>
        );
      })}
    </>
  );
}

function PlaybookList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-sp-3">
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink/60">{title}</p>
      <ul className="mt-1 list-disc pl-sp-4">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
