import { addDays } from "./growth";

// Bienestar (E3): carga de trabajo, modo descanso. Lógica pura (se prueba en tests/wellbeing.test.ts).

export const DEFAULT_LOAD_LIMIT = 6;
export const MAX_LOAD_LIMIT = 30;
export const MAX_REST_DAYS = 60;
export const MAX_BANK_ITEMS = 200;
const DAY = 86_400_000;

export const isDateKey = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().startsWith(v);

/** Días del descanso, contando el primero y el último. */
export function restLength(start: string, end: string) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY) + 1;
}

export type RestCheck = { ok: true; days: number } | { ok: false; reason: "dates" | "order" | "long" | "past" };

/** Un descanso empieza hoy o más adelante, dura entre 1 y 60 días. */
export function validateRest(start: string, end: string, today: string): RestCheck {
  if (!isDateKey(start) || !isDateKey(end)) return { ok: false, reason: "dates" };
  if (end < start) return { ok: false, reason: "order" };
  if (start < today) return { ok: false, reason: "past" };
  const days = restLength(start, end);
  if (days > MAX_REST_DAYS) return { ok: false, reason: "long" };
  return { ok: true, days };
}

export interface LoadItem {
  /** "YYYY-MM-DD" */
  date: string;
}

export interface LoadResult {
  /** Mayor número de entregas dentro de cualquier ventana de 7 días seguidos. */
  peak: number;
  /** Día en que empieza esa ventana. */
  peakStart: string | null;
  over: boolean;
  /** Entregas por semana (lunes a domingo) de las próximas `weeks` semanas. */
  weeks: { start: string; count: number }[];
}

/** Carga de trabajo: cuántas entregas caen en cualquier ventana de 7 días, y semana por semana. */
export function workload(items: LoadItem[], from: string, weeks: number, limit: number): LoadResult {
  const horizonEnd = addDays(from, weeks * 7 - 1);
  const dates = items.map((i) => i.date).filter((d) => d >= from && d <= horizonEnd).sort();
  let peak = 0;
  let peakStart: string | null = null;
  for (let i = 0; i < dates.length; i += 1) {
    const windowEnd = addDays(dates[i], 6);
    let count = 0;
    for (let j = i; j < dates.length && dates[j] <= windowEnd; j += 1) count += 1;
    if (count > peak) {
      peak = count;
      peakStart = dates[i];
    }
  }
  const result: LoadResult["weeks"] = [];
  for (let w = 0; w < weeks; w += 1) {
    const start = addDays(from, w * 7);
    const end = addDays(start, 6);
    result.push({ start, count: dates.filter((d) => d >= start && d <= end).length });
  }
  return { peak, peakStart, over: peak > limit, weeks: result };
}

export interface RestPost {
  id: string;
  dateKey: string;
  time: string;
  status: string;
}
export interface RestDeliverable {
  id: string;
  /** "YYYY-MM-DD" */
  dueKey: string;
  title: string;
  brandId: string;
  status: string;
}
export interface RestPlan {
  days: number;
  posts: { id: string; from: string; to: string; time: string }[];
  deliverables: { id: string; from: string; to: string }[];
  /** Entregas dentro del descanso, para avisar a las marcas. */
  affectedDeliverables: RestDeliverable[];
}

/**
 * Qué se mueve al activar el descanso: las publicaciones programadas dentro del periodo y (si se pide) las entregas
 * pendientes con fecha dentro del periodo, todas hacia adelante tantos días como dura el descanso.
 */
export function planRest(input: { posts: RestPost[]; deliverables: RestDeliverable[]; start: string; end: string; moveDeliverables: boolean }): RestPlan {
  const days = restLength(input.start, input.end);
  const inside = (d: string) => d >= input.start && d <= input.end;
  const posts = input.posts.filter((p) => p.status === "scheduled" && inside(p.dateKey)).map((p) => ({ id: p.id, from: p.dateKey, to: addDays(p.dateKey, days), time: p.time }));
  const pendingDeliverables = input.deliverables.filter((d) => !["approved", "published"].includes(d.status) && inside(d.dueKey));
  const deliverables = input.moveDeliverables ? pendingDeliverables.map((d) => ({ id: d.id, from: d.dueKey, to: addDays(d.dueKey, days) })) : [];
  return { days, posts, deliverables, affectedDeliverables: pendingDeliverables };
}

export interface BrandNotice {
  brandId: string;
  brandName: string;
  email: string | null;
  titles: string[];
}

/** Agrupa las entregas afectadas por marca (una sola nota por marca). */
export function groupByBrand(deliverables: RestDeliverable[], brands: Map<string, { name: string; email: string | null }>): BrandNotice[] {
  const map = new Map<string, BrandNotice>();
  for (const d of deliverables) {
    const brand = brands.get(d.brandId);
    if (!brand) continue;
    const entry = map.get(d.brandId) ?? { brandId: d.brandId, brandName: brand.name, email: brand.email, titles: [] };
    entry.titles.push(d.title);
    map.set(d.brandId, entry);
  }
  return Array.from(map.values()).sort((a, b) => a.brandName.localeCompare(b.brandName));
}

/** Borrador del aviso a la marca (la creadora lo puede editar antes de enviarlo). */
export function restNoticeDraft(opts: { creatorName: string; brandName: string; titles: string[]; start: string; end: string; newDate: string; lang: "es" | "en" }) {
  const list = opts.titles.map((t) => `• ${t}`).join("\n");
  if (opts.lang === "en") {
    return `Hi ${opts.brandName} team,\n\nI'll be taking a short break from ${opts.start} to ${opts.end}. These deliverables fall in that period:\n${list}\n\nI'd like to deliver them from ${opts.newDate} on. Let me know if that works for you or if you need a different date.\n\nThank you for your understanding,\n${opts.creatorName}`;
  }
  return `Hola equipo de ${opts.brandName},\n\nVoy a tomarme un descanso corto del ${opts.start} al ${opts.end}. Estas entregas caen en ese periodo:\n${list}\n\nMe gustaría entregarlas a partir del ${opts.newDate}. Avísame si les funciona o si necesitan otra fecha.\n\nGracias por su comprensión,\n${opts.creatorName}`;
}
