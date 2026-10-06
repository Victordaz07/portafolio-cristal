import { prismaRoot } from "@/lib/prisma-root";
import { MIN_CREATORS, MIN_POSTS, playbookIn, type InsightStats, type Playbook } from "@/lib/insights";
import { MIN_VIEWS, nicheOf } from "@/lib/platform-analytics";
import { isAiConfigured } from "@/lib/ai";
import { NETWORK_META } from "@/lib/content-plan";
import Card from "@/components/admin/Card";
import RefreshInsightsButton from "./RefreshInsightsButton";
import { Stat, eyebrowClass } from "./charts";
import { NICHES } from "@/lib/onboarding";
import { reportWord } from "@/lib/reports";
import { dateLocale, pickLabel, type AdminLang } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

const networkLabel = (key: string) => (key in NETWORK_META ? NETWORK_META[key as keyof typeof NETWORK_META].label : key);
const fmt = (d: Date, lang: AdminLang) => d.toLocaleString(dateLocale(lang), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Pestaña "Inteligencia": lo que Foliocrew aprende de los resultados reales, por nicho. */
export default async function IntelligenceSection() {
  const { t, lang } = await getT();
  const w = (word: string) => reportWord(lang, word);
  const insightLabel = (niche: string, label: string) => {
    if (lang !== "en") return label;
    if (niche === "global") return "Whole platform";
    return NICHES.find((n) => n.id === niche)?.labelEn ?? label;
  };
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
    const row = progress.get(n.id) ?? { label: pickLabel(lang, n), creators: 0, posts: 0 };
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
            <p className={`${eyebrowClass} mb-sp-1`}>{t("Inteligencia Foliocrew", "Foliocrew Intelligence")}</p>
            <p className="text-sm text-ink/75">
              {t(
                "Cada día Foliocrew analiza los resultados reales de las cuentas que aceptaron participar: qué formatos, horarios, largos de caption y ganchos funcionan en cada nicho. Claude escribe un playbook por nicho y ese aprendizaje se usa en las sugerencias de IA y en la tarjeta “Lo que funciona en tu nicho” de quienes participan.",
                "Every day Foliocrew analyzes real results from accounts that agreed to participate: which formats, times, caption lengths and hooks work in each niche. Claude writes a playbook per niche, and that learning powers the AI suggestions and the “What works in your niche” card for participants."
              )}
            </p>
            <p className="mt-sp-2 text-xs text-ink/55">
              {t(
                `Reglas de privacidad: solo cuentas que dieron su permiso · se aprende de un nicho cuando hay al menos ${MIN_CREATORS} cuentas y ${MIN_POSTS} publicaciones con ${MIN_VIEWS}+ vistas · a Claude no se le mandan nombres, @usuarios, marcas ni enlaces · nadie ve datos de otra persona.`,
                `Privacy rules: only accounts that gave permission · a niche is learned once there are at least ${MIN_CREATORS} accounts and ${MIN_POSTS} posts with ${MIN_VIEWS}+ views · Claude never receives names, @handles, brands or links · nobody sees anyone else's data.`
              )}
            </p>
          </div>
          <RefreshInsightsButton aiReady={isAiConfigured()} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Stat value={`${participants.length}/${creators.length}`} label={t("Cuentas que participan", "Participating accounts")} />
        <Stat value={posts.filter((p) => participants.some((c) => c.id === p.creatorId)).reduce((s, p) => s + p._count._all, 0)} label={t("Publicaciones que aportan", "Contributing posts")} />
        <Stat value={niches.length} label={t("Nichos con aprendizaje", "Niches learned")} />
        <Stat value={global ? fmt(global.generatedAt, lang) : "—"} label={t("Último análisis", "Last analysis")} />
      </div>

      {insights.length === 0 && (
        <Card>
          <p className="text-sm text-ink">
            {t("Todavía no hay suficientes datos para aprender. Hacen falta al menos", "There isn't enough data to learn from yet. It needs at least")}{" "}
            <strong>{t(`${MIN_CREATORS} cuentas`, `${MIN_CREATORS} accounts`)}</strong> {t("que participen y", "participating and")}{" "}
            <strong>{t(`${MIN_POSTS} publicaciones`, `${MIN_POSTS} posts`)}</strong> {t("con métricas en un mismo grupo.", "with metrics in the same group.")}
          </p>
          {progress.size > 0 && (
            <ul className="mt-sp-3 flex flex-col gap-1 text-sm text-ink/70">
              {Array.from(progress.values()).map((p) => (
                <li key={p.label}>
                  {p.label}: {p.creators}/{MIN_CREATORS} {t("cuentas", "accounts")} · {p.posts}/{MIN_POSTS} {t("publicaciones", "posts")}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-sp-3 text-xs text-ink/55">
            {t(
              "Cada cuenta ve la invitación a participar en Reportes y en Mi cuenta. Mientras más cuentas participen, mejores son las recomendaciones para todas.",
              "Every account sees the invite to join in Reports and My account. The more accounts participate, the better the recommendations for everyone."
            )}
          </p>
        </Card>
      )}

      {[...(global ? [global] : []), ...niches].map((i) => {
        const s = i.stats as unknown as InsightStats;
        const raw = i.playbook as unknown as Playbook | null;
        const pb = raw ? playbookIn(raw, lang) : null;
        return (
          <Card key={i.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-sp-2">
              <p className="font-fraunces text-2xl font-semibold text-ink">{insightLabel(i.niche, i.label)}</p>
              <p className="text-xs text-ink/55">
                {t(
                  `${i.creators} cuentas · ${i.posts} publicaciones · actualizado ${fmt(i.generatedAt, lang)}`,
                  `${i.creators} accounts · ${i.posts} posts · updated ${fmt(i.generatedAt, lang)}`
                )}
              </p>
            </div>
            <div className="mt-sp-3 grid gap-sp-4 lg:grid-cols-2">
              <div className="flex flex-col gap-sp-2 text-sm text-ink">
                <p>
                  {t("Engagement mediano", "Median engagement")} <strong>{s.medianEr ?? "—"}%</strong> · {t("vistas medianas", "median views")}{" "}
                  <strong>{s.medianViews?.toLocaleString(dateLocale(lang)) ?? "—"}</strong>
                  {s.medianDeal != null && (
                    <>
                      {" "}
                      · {t("precio mediano por trato", "median price per deal")} <strong>US${s.medianDeal}</strong> ({s.deals})
                    </>
                  )}
                </p>
                {s.bestSlots.length > 0 && (
                  <p>
                    🕒 {t("Mejores franjas:", "Best slots:")} {s.bestSlots.map((b) => `${w(b.day)} ${w(b.slot).toLowerCase()} (${b.median}%)`).join(" · ")}
                    {s.worstSlots.length > 0 && (
                      <span className="text-ink/55">
                        {" "}
                        · {t("peores:", "worst:")} {s.worstSlots.map((b) => `${w(b.day)} ${w(b.slot).toLowerCase()}`).join(", ")}
                      </span>
                    )}
                  </p>
                )}
                <p>🎬 {t("Formato:", "Format:")} {s.byType.map((x) => `${w(x.key)} ${x.medianEr}% (${x.posts})`).join(" · ")}</p>
                <p>📱 {t("Red:", "Network:")} {s.byPlatform.map((x) => `${networkLabel(x.key)} ${x.medianEr}% (${x.posts})`).join(" · ")}</p>
                <p>✍️ Caption: {s.captionLength.map((x) => `${w(x.key)} ${x.medianEr}%`).join(" · ")}</p>
                <p>🤝 {s.collab.map((x) => `${w(x.key)} ${x.medianEr}% (${x.posts})`).join(" · ")}</p>
              </div>
              {pb ? (
                <div className="rounded-[14px] bg-cream p-sp-4 text-sm text-ink">
                  <p className="font-semibold">{pb.summary}</p>
                  <PlaybookList title={t("✅ Lo que funciona", "✅ What works")} items={pb.whatWorks} />
                  <PlaybookList title={t("❌ Lo que no", "❌ What doesn't")} items={pb.whatDoesnt} />
                  <PlaybookList title={t("🪝 Ganchos", "🪝 Hooks")} items={pb.hooks} />
                  <PlaybookList title={t("🎯 Recomendaciones", "🎯 Recommendations")} items={pb.recommendations} />
                </div>
              ) : (
                <p className="rounded-[14px] bg-cream p-sp-4 text-sm text-ink/65">
                  {isAiConfigured()
                    ? t("El análisis de Claude se escribe en el próximo cálculo.", "Claude's analysis is written on the next run.")
                    : t("Falta ANTHROPIC_API_KEY para que Claude escriba el análisis.", "ANTHROPIC_API_KEY is missing for Claude to write the analysis.")}
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
