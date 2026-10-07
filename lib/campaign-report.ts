import { engagementRate, type CardMetrics } from "./metrics";

// Reporte de campaña para la marca (C3). Lógica pura (se prueba en tests/campaign-report.test.ts):
// arma la «foto» de los números, calcula totales y la comparación con el promedio de la creadora,
// y decide EXACTAMENTE qué ve la marca cuando la creadora oculta métricas.

export const REPORT_METRICS = ["views", "likes", "comments", "shares", "saves", "engagement", "comparison", "topComments"] as const;
export type ReportMetric = (typeof REPORT_METRICS)[number];
export const isReportMetric = (value: string): value is ReportMetric => (REPORT_METRICS as readonly string[]).includes(value);

/** Con menos publicaciones de comparación la «comparación con su promedio» no es honesta y no se muestra. */
export const MIN_BASELINE_POSTS = 3;
/** Cuántos comentarios destacados se muestran como máximo. */
export const MAX_TOP_COMMENTS = 3;

export interface ReportPost extends CardMetrics {
  /** Estable entre actualizaciones: «c:<id de la publicación>» o «d:<id del entregable>». */
  key: string;
  title: string;
  platform: string | null;
  /** Enlace a la publicación (solo http/https). */
  url: string | null;
  thumbnailUrl: string | null;
  topComment: string | null;
  topCommentAuthor: string | null;
  /** La creadora puede dejar fuera una publicación del reporte. */
  include: boolean;
}

export interface ReportBaseline {
  /** Cuántas publicaciones de la creadora (fuera de esta campaña) sirven de comparación. */
  posts: number;
  medianViews: number | null;
  medianEngagement: number | null;
}

export interface ReportData {
  posts: ReportPost[];
  baseline: ReportBaseline | null;
  builtAt: string;
}

export interface CardRow extends CardMetrics {
  id: string;
  platform: string;
  postUrl: string | null;
  thumbnailUrl: string | null;
  caption: string;
  topComment: string | null;
  topCommentAuthor: string | null;
}

export interface DeliverableRow {
  id: string;
  title: string;
  network: string | null;
  proofUrl: string | null;
  status: string;
}

const httpOnly = (url: string | null | undefined) => (url && /^https?:\/\//i.test(url.trim()) ? url.trim() : null);

/** Para saber si un entregable y una publicación son la misma pieza: sin «?…», «#…», «www.» ni barra final. */
export function normalizeUrl(url: string | null | undefined) {
  if (!url) return null;
  return url.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").replace(/\/+$/, "") || null;
}

export function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

const firstLine = (text: string) => {
  const line = text.split("\n")[0].trim();
  return line.length > 90 ? `${line.slice(0, 87)}…` : line;
};

/** Entregables que cuentan como «ya hecho»: publicados o aprobados y con enlace. */
export const isDelivered = (d: DeliverableRow) => (d.status === "published" || d.status === "approved") && Boolean(httpOnly(d.proofUrl));

export function buildReportData(input: { cards: CardRow[]; deliverables: DeliverableRow[]; baselineCards: CardMetrics[]; previous?: ReportData | null; now?: Date }): ReportData {
  const kept = new Map((input.previous?.posts ?? []).map((p) => [p.key, p.include]));
  const posts: ReportPost[] = input.cards.map((c) => ({
    key: `c:${c.id}`,
    title: firstLine(c.caption) || c.platform,
    platform: c.platform,
    url: httpOnly(c.postUrl),
    thumbnailUrl: httpOnly(c.thumbnailUrl),
    views: c.views,
    likes: c.likes,
    comments: c.comments,
    shares: c.shares,
    saves: c.saves,
    topComment: c.topComment?.trim() || null,
    topCommentAuthor: c.topCommentAuthor?.trim() || null,
    include: kept.get(`c:${c.id}`) ?? true,
  }));
  const byUrl = new Map(posts.filter((p) => p.url).map((p) => [normalizeUrl(p.url), p]));
  for (const d of input.deliverables.filter(isDelivered)) {
    const match = byUrl.get(normalizeUrl(d.proofUrl));
    if (match) {
      // Es la misma pieza: se queda la publicación (con sus números) y se usa el nombre del entregable.
      match.title = d.title;
      continue;
    }
    posts.push({
      key: `d:${d.id}`,
      title: d.title,
      platform: d.network,
      url: httpOnly(d.proofUrl),
      thumbnailUrl: null,
      views: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      topComment: null,
      topCommentAuthor: null,
      include: kept.get(`d:${d.id}`) ?? true,
    });
  }
  const withViews = input.baselineCards.filter((c) => c.views != null && c.views > 0);
  const rates = input.baselineCards.map((c) => engagementRate(c)).filter((r): r is number => r != null);
  const baseline: ReportBaseline | null =
    withViews.length >= MIN_BASELINE_POSTS ? { posts: withViews.length, medianViews: median(withViews.map((c) => c.views as number)), medianEngagement: median(rates) } : null;
  return { posts, baseline, builtAt: (input.now ?? new Date()).toISOString() };
}

const sum = (values: (number | null)[]) => {
  const present = values.filter((v): v is number => v != null);
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
};

export interface ReportTotals extends CardMetrics {
  posts: number;
  engagement: number | null;
}

/** Totales de las publicaciones incluidas. */
export function reportTotals(posts: ReportPost[]): ReportTotals {
  const included = posts.filter((p) => p.include);
  const totals: CardMetrics = {
    views: sum(included.map((p) => p.views)),
    likes: sum(included.map((p) => p.likes)),
    comments: sum(included.map((p) => p.comments)),
    shares: sum(included.map((p) => p.shares)),
    saves: sum(included.map((p) => p.saves)),
  };
  return { ...totals, posts: included.length, engagement: engagementRate(totals) };
}

export interface Comparison {
  /** Vistas promedio por publicación de la campaña. */
  avgViews: number | null;
  /** Cuántas veces su vista mediana habitual (1.4 = 40 % más). */
  viewsRatio: number | null;
  medianViews: number | null;
  engagement: number | null;
  medianEngagement: number | null;
}

export function compare(posts: ReportPost[], baseline: ReportBaseline | null): Comparison | null {
  if (!baseline) return null;
  const withViews = posts.filter((p) => p.include && p.views != null && p.views > 0);
  const avgViews = withViews.length ? Math.round(withViews.reduce((a, p) => a + (p.views as number), 0) / withViews.length) : null;
  const viewsRatio = avgViews != null && baseline.medianViews ? Math.round((avgViews / baseline.medianViews) * 10) / 10 : null;
  const totals = reportTotals(posts);
  if (viewsRatio == null && totals.engagement == null) return null;
  return { avgViews, viewsRatio, medianViews: baseline.medianViews, engagement: totals.engagement, medianEngagement: baseline.medianEngagement };
}

export interface PublicPost {
  title: string;
  platform: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  /** Solo trae las métricas que la creadora NO ocultó. */
  metrics: Partial<Record<"views" | "likes" | "comments" | "shares" | "saves" | "engagement", number>>;
}

export interface PublicReport {
  posts: PublicPost[];
  totals: Partial<Record<"views" | "likes" | "comments" | "shares" | "saves" | "engagement", number>> & { posts: number };
  comparison: { viewsRatio: number | null; avgViews: number | null; medianViews: number | null; engagement: number | null; medianEngagement: number | null } | null;
  topComments: { text: string; author: string | null }[];
}

const SIMPLE = ["views", "likes", "comments", "shares", "saves"] as const;

/**
 * Lo que ve la marca. Es la ÚNICA función que decide qué sale en la página pública: una métrica oculta
 * ni siquiera se incluye en el objeto, así no puede filtrarse por error en el HTML.
 */
export function publicReport(data: ReportData, hidden: string[]): PublicReport {
  const hide = new Set(hidden);
  const included = data.posts.filter((p) => p.include);
  const pick = (m: CardMetrics) => {
    const out: PublicPost["metrics"] = {};
    for (const key of SIMPLE) if (!hide.has(key) && m[key] != null) out[key] = m[key] as number;
    if (!hide.has("engagement")) {
      const rate = engagementRate(m);
      if (rate != null) out.engagement = rate;
    }
    return out;
  };
  const totals = reportTotals(data.posts);
  const cmp = hide.has("comparison") ? null : compare(data.posts, data.baseline);
  const comparison = cmp
    ? {
        viewsRatio: hide.has("views") ? null : cmp.viewsRatio,
        avgViews: hide.has("views") ? null : cmp.avgViews,
        medianViews: hide.has("views") ? null : cmp.medianViews,
        engagement: hide.has("engagement") ? null : cmp.engagement,
        medianEngagement: hide.has("engagement") ? null : cmp.medianEngagement,
      }
    : null;
  return {
    posts: included.map((p) => ({ title: p.title, platform: p.platform, url: p.url, thumbnailUrl: p.thumbnailUrl, metrics: pick(p) })),
    totals: { posts: totals.posts, ...pick(totals) },
    comparison: comparison && (comparison.viewsRatio != null || comparison.engagement != null) ? comparison : null,
    topComments: hide.has("topComments")
      ? []
      : included
          .filter((p) => p.topComment)
          .slice(0, MAX_TOP_COMMENTS)
          .map((p) => ({ text: p.topComment as string, author: p.topCommentAuthor })),
  };
}
