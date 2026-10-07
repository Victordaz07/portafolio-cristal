import { engagementRate, type CardMetrics } from "./metrics";

// Media kit verificado (C4). Lógica pura (se prueba en tests/verified.test.ts).
// Regla: el sello «Datos verificados por Foliocrew» solo va en números que vienen de una red conectada
// y se actualizaron hace poco. Un número escrito a mano nunca lo lleva.

/** Pasado este tiempo sin actualizarse, el dato deja de llevar sello (sigue visible, sin sello). */
export const SEAL_MAX_DAYS = 30;
/** Cuántos casos de éxito salen como máximo en el media kit. */
export const MAX_CASE_STUDIES = 3;

export interface Seal {
  /** Fecha del dato más antiguo que sostiene el número. */
  asOf: string;
  days: number;
}

const DAY_MS = 86_400_000;

/** Días enteros entre dos fechas (nunca negativo). */
export function daysSince(date: Date | string, now: Date = new Date()) {
  const then = typeof date === "string" ? new Date(date.length === 10 ? `${date}T12:00:00Z` : date) : date;
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / DAY_MS));
}

function seal(dates: (Date | string)[], now: Date): Seal | null {
  if (!dates.length) return null;
  const times = dates.map((d) => (typeof d === "string" ? new Date(d.length === 10 ? `${d}T12:00:00Z` : d) : d).getTime());
  if (times.some((t) => Number.isNaN(t))) return null;
  const oldest = new Date(Math.min(...times));
  const days = daysSince(oldest, now);
  return days > SEAL_MAX_DAYS ? null : { asOf: oldest.toISOString(), days };
}

export interface FollowerPoint {
  platform: string;
  date: string;
  source: string;
}

/** Sello de los seguidores de una red: solo si el último dato lo trajo la cuenta conectada. */
export function followerSeal(point: FollowerPoint, now: Date = new Date()) {
  return point.source === "auto" ? seal([point.date], now) : null;
}

/** Sello del total de seguidores: todas las redes sumadas deben ser datos automáticos. */
export function totalFollowerSeal(points: FollowerPoint[], now: Date = new Date()) {
  if (!points.length || points.some((p) => p.source !== "auto")) return null;
  return seal(points.map((p) => p.date), now);
}

export interface CardForSeal extends CardMetrics {
  metricsSyncedAt: Date | null;
}

/**
 * Engagement promedio y su sello. El sello solo va si TODAS las publicaciones que entran en el promedio
 * tienen métricas traídas de la red (metricsSyncedAt); si una se escribió a mano, no hay sello.
 */
export function engagementSummary(cards: CardForSeal[], now: Date = new Date()) {
  const rated = cards.map((c) => ({ card: c, rate: engagementRate(c) })).filter((r): r is { card: CardForSeal; rate: number } => r.rate != null);
  if (!rated.length) return { value: null as number | null, seal: null as Seal | null };
  const value = Math.round((rated.reduce((a, r) => a + r.rate, 0) / rated.length) * 10) / 10;
  const synced = rated.every((r) => r.card.metricsSyncedAt);
  return { value, seal: synced ? seal(rated.map((r) => r.card.metricsSyncedAt as Date), now) : null };
}

export interface MetricsPatch {
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
}

/** Si la persona cambió algún número a mano, ese número deja de estar «verificado». */
export function editsMetrics(patch: MetricsPatch) {
  return (["views", "likes", "comments", "shares", "saves"] as const).some((k) => patch[k] !== undefined);
}

export interface CaseStudyInput {
  brand: string;
  title: string;
  totals: { views?: number; engagement?: number; posts: number };
  comparison: { viewsRatio: number | null } | null;
}

/** Texto corto del caso de éxito, sin inventar nada: solo lo que ya muestra el reporte. */
export function caseStudyHighlights(c: CaseStudyInput) {
  const out: { key: "views" | "engagement" | "ratio" | "posts"; value: number }[] = [];
  if (c.totals.views != null) out.push({ key: "views", value: c.totals.views });
  if (c.totals.engagement != null) out.push({ key: "engagement", value: c.totals.engagement });
  if (c.comparison?.viewsRatio != null && c.comparison.viewsRatio > 1) out.push({ key: "ratio", value: c.comparison.viewsRatio });
  if (!out.length) out.push({ key: "posts", value: c.totals.posts });
  return out;
}
