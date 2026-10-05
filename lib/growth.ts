import type { AdminLang } from "./admin-lang";
// Utilidades de Crecimiento (metas, plan semanal y bitácora). Sin dependencias de servidor:
// se usan también en componentes de cliente.

export const GOAL_CATEGORIES = ["content", "audience", "skill", "habit"] as const;
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const GOAL_CATEGORY_LABEL: Record<GoalCategory, string> = {
  content: "Contenido",
  audience: "Audiencia",
  skill: "Habilidad",
  habit: "Hábito",
};

export function categoryLabel(value: string) {
  return GOAL_CATEGORY_LABEL[value as GoalCategory] ?? value;
}

/** Fuentes automáticas para el valor actual de una meta. */
export const GOAL_SOURCES = {
  manual: "Manual (lo actualizas tú)",
  instagram_followers: "Automático: seguidores de Instagram",
  tiktok_followers: "Automático: seguidores de TikTok",
  youtube_followers: "Automático: suscriptores de YouTube",
  facebook_followers: "Automático: seguidores de la página de Facebook",
  feed_posts_month: "Automático: publicaciones del Feed este mes",
} as const;
export type GoalSource = keyof typeof GOAL_SOURCES;

export function isGoalSource(value: string): value is GoalSource {
  return value in GOAL_SOURCES;
}

export const LOG_KINDS = ["milestone", "learning", "journal"] as const;
export type LogKind = (typeof LOG_KINDS)[number];

export const LOG_KIND_LABEL: Record<LogKind, string> = {
  milestone: "Hito",
  learning: "Aprendizaje",
  journal: "Diario",
};

export function goalPercent(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

/** 41200 → "41.2K", 1500000 → "1.5M"; con unidad: "17 videos". */
export function formatGoalValue(value: number, unit?: string | null) {
  let text: string;
  if (Math.abs(value) >= 1_000_000) text = `${trim(value / 1_000_000)}M`;
  else if (Math.abs(value) >= 10_000) text = `${trim(value / 1_000)}K`;
  else text = trim(value);
  return unit ? `${text} ${unit}` : text;
}

function trim(value: number) {
  return String(Math.round(value * 10) / 10);
}

// ─── Fechas en la zona horaria de la app ───
// Las semanas y las rachas dependen del día local, no del día UTC del servidor.

export const DEFAULT_TIMEZONE = "America/New_York";

/** "YYYY-MM-DD" del día de `date` en la zona horaria dada. */
export function localDateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function keyToUtc(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcToKey(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(key: string, days: number) {
  return utcToKey(keyToUtc(key) + days * 86_400_000);
}

/** Lunes de la semana de `key`. */
export function weekStartOf(key: string) {
  const weekday = new Date(keyToUtc(key)).getUTCDay(); // 0 = domingo
  return addDays(key, weekday === 0 ? -6 : 1 - weekday);
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-28" → "28 sep 2026" */
export function formatDateKey(key: string, withYear = true, lang: AdminLang = "es") {
  const [y, m, d] = key.split("-").map(Number);
  if (lang === "en") return withYear ? `${MONTHS_EN[m - 1]} ${d}, ${y}` : `${MONTHS_EN[m - 1]} ${d}`;
  return withYear ? `${d} ${MONTHS[m - 1]} ${y}` : `${d} ${MONTHS[m - 1]}`;
}

/** "Semana del 28 sep al 4 oct" */
export function weekLabel(weekStart: string, lang: AdminLang = "es") {
  if (lang === "en") return `Week of ${formatDateKey(weekStart, false, "en")} – ${formatDateKey(addDays(weekStart, 6), false, "en")}`;
  return `Semana del ${formatDateKey(weekStart, false)} al ${formatDateKey(addDays(weekStart, 6), false)}`;
}

/**
 * Días seguidos con actividad, contando hacia atrás desde hoy.
 * Si hoy todavía no hubo actividad, la racha sigue viva desde ayer.
 */
export function streakDays(activeDays: Set<string>, today: string) {
  let day = activeDays.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (activeDays.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}
