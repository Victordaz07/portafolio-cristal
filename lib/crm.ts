// Utilidades del CRM de marcas (panel v2): estados del trato, pagos, fechas y montos.
import type { AdminLang } from "./admin-lang";

export const DEAL_STATUSES = ["prospect", "negotiating", "active", "completed"] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const DEAL_STATUS_META: Record<DealStatus, { label: string; labelEn: string; className: string }> = {
  prospect: { label: "Prospecto", labelEn: "Prospect", className: "bg-lime/35 text-ink" },
  negotiating: { label: "Negociando", labelEn: "Negotiating", className: "bg-coral/15 text-coral" },
  active: { label: "Activo", labelEn: "Active", className: "bg-sage/40 text-cobalt" },
  completed: { label: "Completado", labelEn: "Completed", className: "bg-ink/10 text-ink/70" },
};

export const PAYMENT_STATUSES = ["pending", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; labelEn: string; className: string }> = {
  pending: { label: "Pendiente", labelEn: "Pending", className: "bg-coral/15 text-moss" },
  paid: { label: "Pagado", labelEn: "Paid", className: "bg-sage/40 text-cobalt" },
};

export const CRM_PLATFORMS = ["Instagram", "TikTok", "Facebook", "YouTube", "UGC"] as const;

export function isDealStatus(value: string | null | undefined): value is DealStatus {
  return !!value && (DEAL_STATUSES as readonly string[]).includes(value);
}

export function isPaymentStatus(value: string | null | undefined): value is PaymentStatus {
  return !!value && (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function formatMoney(value: number | null | undefined) {
  if (value == null) return "—";
  return "$" + value.toLocaleString("en-US");
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDate(value: Date | string) {
  return typeof value === "string" ? new Date(value) : value;
}

/** "28 sep" (o "28 sep 2025" si no es del año en curso). Usa UTC porque las fechas se guardan a mediodía UTC. */
export function formatShortDate(value: Date | string | null | undefined, lang: AdminLang = "es") {
  if (!value) return "—";
  const date = toDate(value);
  const label = lang === "en" ? `${MONTHS_EN[date.getUTCMonth()]} ${date.getUTCDate()}` : `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  return date.getUTCFullYear() === new Date().getUTCFullYear()
    ? label
    : `${label} ${date.getUTCFullYear()}`;
}

/** Días entre hoy y la fecha (negativo = ya pasó). Compara por día calendario. */
export function daysUntil(value: Date | string, now: Date = new Date()) {
  const date = toDate(value);
  const target = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86_400_000);
}

/** "Vencido hace 2d", "Hoy", "En 3d". */
export function dueLabel(value: Date | string, lang: AdminLang = "es") {
  const days = daysUntil(value);
  if (lang === "en") return days < 0 ? `Overdue ${-days}d` : days === 0 ? "Today" : `In ${days}d`;
  if (days < 0) return `Vencido hace ${-days}d`;
  if (days === 0) return "Hoy";
  return `En ${days}d`;
}

/** "2026-10-02" → Date a mediodía UTC, para que el día no cambie por zona horaria. */
export function dateInputToDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

/** Date → "2026-10-02" para un <input type="date">. */
export function dateToInput(value: Date | string | null | undefined) {
  if (!value) return "";
  return toDate(value).toISOString().slice(0, 10);
}
