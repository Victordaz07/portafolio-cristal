import { formatCompact } from "@/lib/metrics";
import type { PublicReport } from "@/lib/campaign-report";

// El reporte tal como lo ve la marca. Solo pinta lo que trae `publicReport()` (lib/campaign-report.ts):
// una métrica oculta nunca llega hasta aquí.

const COPY = {
  es: {
    eyebrow: "Reporte de campaña",
    forBrand: (brand: string, creator: string) => `Para ${brand} · por ${creator}`,
    posts: "Publicaciones",
    views: "Vistas",
    likes: "Me gusta",
    comments: "Comentarios",
    shares: "Compartidos",
    saves: "Guardados",
    engagement: "Interacción",
    comparisonTitle: "Comparado con su promedio habitual",
    viewsRatio: (avg: string, ratio: number, median: string) => `${avg} vistas por publicación: ${ratio >= 1 ? `${ratio}× su promedio habitual (${median})` : `${Math.round(ratio * 100)} % de su promedio habitual (${median})`}`,
    engagementCmp: (x: number, median: number) => `Interacción: ${x}% (su promedio habitual: ${median}%)`,
    postsTitle: "Lo que se publicó",
    view: "Ver la publicación",
    noNumbers: "Sin números disponibles",
    topComments: "Lo que dijo la gente",
    repeatTitle: "¿Repetimos?",
    repeatBody: (creator: string) => `A ${creator} le encantaría volver a trabajar con ustedes. Mira los paquetes y elige el que mejor se ajuste.`,
    repeatButton: "Ver los paquetes",
    footer: "Reporte creado con Foliocrew",
    empty: "Todavía no hay publicaciones en este reporte.",
  },
  en: {
    eyebrow: "Campaign report",
    forBrand: (brand: string, creator: string) => `For ${brand} · by ${creator}`,
    posts: "Posts",
    views: "Views",
    likes: "Likes",
    comments: "Comments",
    shares: "Shares",
    saves: "Saves",
    engagement: "Engagement",
    comparisonTitle: "Compared with their usual average",
    viewsRatio: (avg: string, ratio: number, median: string) => `${avg} views per post: ${ratio >= 1 ? `${ratio}× their usual average (${median})` : `${Math.round(ratio * 100)}% of their usual average (${median})`}`,
    engagementCmp: (x: number, median: number) => `Engagement: ${x}% (their usual average: ${median}%)`,
    postsTitle: "What was published",
    view: "See the post",
    noNumbers: "No numbers available",
    topComments: "What people said",
    repeatTitle: "Shall we do it again?",
    repeatBody: (creator: string) => `${creator} would love to work with you again. Take a look at the packages and pick the one that fits best.`,
    repeatButton: "See the packages",
    footer: "Report created with Foliocrew",
    empty: "There are no posts in this report yet.",
  },
} as const;

const METRIC_ORDER = ["views", "likes", "comments", "shares", "saves", "engagement"] as const;

export default function ReportDocument({
  lang,
  title,
  intro,
  brandName,
  creatorName,
  report,
  repeatUrl,
}: {
  lang: "es" | "en";
  title: string;
  intro: string | null;
  brandName: string;
  creatorName: string;
  report: PublicReport;
  repeatUrl: string;
}) {
  const c = COPY[lang];
  const show = (key: (typeof METRIC_ORDER)[number], value: number | undefined) => (key === "engagement" ? `${value}%` : formatCompact(value));
  const totalTiles = [
    { key: "posts", label: c.posts, value: String(report.totals.posts) },
    ...METRIC_ORDER.filter((k) => report.totals[k] != null).map((k) => ({ key: k, label: c[k], value: show(k, report.totals[k]) })),
  ];
  const cmp = report.comparison;

  return (
    <article className="mx-auto max-w-3xl rounded-[18px] border border-line bg-white p-sp-5 shadow-sm sm:p-sp-8 print:border-0 print:shadow-none">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{c.eyebrow}</p>
      <h1 className="mt-sp-2 font-fraunces text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h1>
      <p className="mt-sp-2 text-sm text-ink/60">{c.forBrand(brandName, creatorName)}</p>
      {intro && <p className="mt-sp-4 whitespace-pre-line text-[15px] leading-relaxed text-ink/80">{intro}</p>}

      <div className="mt-sp-6 grid grid-cols-2 gap-sp-3 sm:grid-cols-3">
        {totalTiles.map((tile) => (
          <div key={tile.key} className="rounded-[14px] bg-cream p-sp-3">
            <p className="font-fraunces text-2xl font-semibold text-ink">{tile.value}</p>
            <p className="mt-0.5 text-xs text-ink/60">{tile.label}</p>
          </div>
        ))}
      </div>

      {cmp && (
        <section className="mt-sp-5 rounded-[14px] border border-lime/50 bg-lime/15 p-sp-4">
          <p className="text-sm font-semibold text-ink">{c.comparisonTitle}</p>
          <ul className="mt-sp-1 flex flex-col gap-1 text-sm text-ink/80">
            {cmp.viewsRatio != null && cmp.avgViews != null && cmp.medianViews != null && <li>{c.viewsRatio(formatCompact(cmp.avgViews), cmp.viewsRatio, formatCompact(cmp.medianViews))}</li>}
            {cmp.engagement != null && cmp.medianEngagement != null && <li>{c.engagementCmp(cmp.engagement, cmp.medianEngagement)}</li>}
          </ul>
        </section>
      )}

      <section className="mt-sp-6">
        <h2 className="font-fraunces text-xl font-semibold text-ink">{c.postsTitle}</h2>
        {report.posts.length === 0 ? (
          <p className="mt-sp-3 text-sm text-ink/60">{c.empty}</p>
        ) : (
          <ul className="mt-sp-3 flex flex-col gap-sp-3">
            {report.posts.map((post, i) => {
              const keys = METRIC_ORDER.filter((k) => post.metrics[k] != null);
              return (
                <li key={i} className="flex gap-sp-3 rounded-[14px] border border-line p-sp-3">
                  {post.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.thumbnailUrl} alt="" referrerPolicy="no-referrer" className="h-20 w-20 shrink-0 rounded-[10px] object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{post.title}</p>
                    {post.platform && <p className="font-mono text-[10px] uppercase tracking-wide text-ink/50">{post.platform}</p>}
                    <p className="mt-1 flex flex-wrap gap-x-sp-3 gap-y-0.5 text-[13px] text-ink/75">
                      {keys.length ? keys.map((k) => <span key={k}>{`${c[k]}: ${show(k, post.metrics[k])}`}</span>) : <span className="text-ink/45">{c.noNumbers}</span>}
                    </p>
                    {post.url && (
                      <a href={post.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[13px] font-semibold text-coral hover:underline print:no-underline">
                        {c.view} ↗
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {report.topComments.length > 0 && (
        <section className="mt-sp-6">
          <h2 className="font-fraunces text-xl font-semibold text-ink">{c.topComments}</h2>
          <ul className="mt-sp-3 flex flex-col gap-sp-3">
            {report.topComments.map((q, i) => (
              <li key={i} className="rounded-[14px] bg-cream p-sp-3 text-[15px] italic text-ink/85">
                “{q.text}”{q.author && <span className="ml-1 text-xs not-italic text-ink/50">— {q.author}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-sp-8 rounded-[18px] bg-ink p-sp-5 text-center text-cream print:bg-white print:text-ink print:border print:border-line">
        <h2 className="font-fraunces text-2xl font-semibold">{c.repeatTitle}</h2>
        <p className="mx-auto mt-sp-2 max-w-md text-sm opacity-80">{c.repeatBody(creatorName)}</p>
        <a href={repeatUrl} className="mt-sp-4 inline-block rounded-full bg-coral px-sp-5 py-2.5 text-sm font-bold text-white hover:opacity-90 print:hidden">
          {c.repeatButton}
        </a>
      </section>
      <p className="mt-sp-5 text-center text-[11px] text-ink/40">{c.footer}</p>
    </article>
  );
}
