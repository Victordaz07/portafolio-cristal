// Métricas de publicaciones (Feed). Sin dependencias de servidor.

export interface CardMetrics {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
}

/** Con menos vistas el porcentaje no dice nada (1 vista y 2 likes = 200 %) y ensucia promedios. */
export const MIN_VIEWS_FOR_ENGAGEMENT = 10;

/** Engagement = (likes + comentarios + compartidos + guardados) / vistas, en %. */
export function engagementRate(m: CardMetrics) {
  if (!m.views || m.views < MIN_VIEWS_FOR_ENGAGEMENT) return null;
  const interactions = (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0) + (m.saves ?? 0);
  if (interactions === 0) return null;
  return Math.round((interactions / m.views) * 1000) / 10;
}

/** 540000 → "540K", 1234567 → "1.2M", 890 → "890". */
export function formatCompact(value: number | null | undefined) {
  if (value == null) return "—";
  if (value >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (value >= 10_000) return `${Math.round(value / 1_000)}K`;
  if (value >= 1_000) return `${trim(value / 1_000)}K`;
  return String(value);
}

function trim(value: number) {
  return String(Math.round(value * 10) / 10);
}

export function hasMetrics(m: CardMetrics) {
  return [m.views, m.likes, m.comments, m.shares, m.saves].some((v) => v != null);
}

/** Las 4 métricas que se muestran en las tarjetas (como en el diseño). */
export function metricTiles(m: CardMetrics, labels: { views: string; likes: string; comments: string; engagement: string }) {
  const rate = engagementRate(m);
  return [
    { key: "views", label: labels.views, value: formatCompact(m.views), highlight: false },
    { key: "likes", label: labels.likes, value: formatCompact(m.likes), highlight: false },
    { key: "comments", label: labels.comments, value: formatCompact(m.comments), highlight: false },
    { key: "engagement", label: labels.engagement, value: rate == null ? "—" : `${rate}%`, highlight: true },
  ];
}
