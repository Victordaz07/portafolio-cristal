// Facturas (B3): lo que se puede calcular sin base de datos. Se prueba en tests/invoices.test.ts.

export type InvoiceItem = { description: string; quantity: number; unitAmount: number };
export type InvoiceKind = "full" | "deposit" | "balance";
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
/** Estado que se muestra: "vista" y "vencida" se calculan. */
export type InvoiceDisplayStatus = InvoiceStatus | "viewed" | "overdue";

export const INVOICE_KINDS: { id: InvoiceKind; label: string; labelEn: string }[] = [
  { id: "full", label: "Factura", labelEn: "Invoice" },
  { id: "deposit", label: "Anticipo", labelEn: "Deposit" },
  { id: "balance", label: "Saldo", labelEn: "Balance" },
];

export const INVOICE_STATUS_META: Record<InvoiceDisplayStatus, { label: string; labelEn: string; className: string }> = {
  draft: { label: "Borrador", labelEn: "Draft", className: "bg-cream text-ink/70" },
  sent: { label: "Enviada", labelEn: "Sent", className: "bg-cobalt/15 text-cobalt-ink" },
  viewed: { label: "Vista", labelEn: "Viewed", className: "bg-sage/40 text-ink" },
  overdue: { label: "Vencida", labelEn: "Overdue", className: "bg-coral/15 text-coral" },
  paid: { label: "Pagada", labelEn: "Paid", className: "bg-lime/40 text-moss" },
  void: { label: "Anulada", labelEn: "Void", className: "bg-ink/10 text-ink/50 line-through" },
};

/** Recordatorios a la marca: el día que vence y a los 7 y 14 días (máximo 3). */
export const REMINDER_OFFSETS = [0, 7, 14] as const;

const DAY = 86_400_000;

/** Días enteros (por fecha de calendario en UTC) de `from` a `to`. */
export function calendarDays(from: Date, to: Date) {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / DAY);
}

/** Total en centavos (nunca negativo; cantidades y montos inválidos cuentan como 0). */
export function itemsTotal(items: InvoiceItem[]) {
  return items.reduce((sum, i) => {
    const q = Number.isFinite(i.quantity) && i.quantity > 0 ? i.quantity : 0;
    const a = Number.isFinite(i.unitAmount) && i.unitAmount > 0 ? Math.round(i.unitAmount) : 0;
    return sum + Math.round(q * a);
  }, 0);
}

/** "FC-2026-0007" */
export function invoiceNumber(prefix: string, year: number, n: number) {
  const clean = (prefix || "FC").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "FC";
  return `${clean}-${year}-${String(n).padStart(4, "0")}`;
}

/** Monto del anticipo y del saldo (en centavos) para un total y un porcentaje. */
export function depositSplit(total: number, percent: number) {
  const p = Math.min(100, Math.max(0, percent));
  const deposit = Math.round((total * p) / 100);
  return { deposit, balance: total - deposit };
}

export function displayStatus(inv: { status: string; dueAt: Date; viewedAt: Date | null }, now: Date = new Date()): InvoiceDisplayStatus {
  if (inv.status === "sent") {
    if (calendarDays(inv.dueAt, now) > 0) return "overdue";
    return inv.viewedAt ? "viewed" : "sent";
  }
  return (["draft", "paid", "void"] as const).includes(inv.status as "draft") ? (inv.status as InvoiceStatus) : "draft";
}

/** ¿Toca mandarle hoy un recordatorio a la marca? Uno por escalón y máximo uno por día. */
export function reminderDue(
  inv: { status: string; dueAt: Date; remindersSent: number; lastReminderAt: Date | null },
  now: Date = new Date()
) {
  if (inv.status !== "sent" || inv.remindersSent >= REMINDER_OFFSETS.length) return false;
  if (inv.lastReminderAt && calendarDays(inv.lastReminderAt, now) < 1) return false;
  return calendarDays(inv.dueAt, now) >= REMINDER_OFFSETS[inv.remindersSent];
}

/** $1,234.50 (los montos se guardan en centavos). */
export function formatCents(cents: number, currency = "USD", lang: "es" | "en" = "es") {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "es-US", { style: "currency", currency, minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}

/** Lee los ítems guardados como JSON (lo que no tenga forma válida se descarta). */
export function parseItems(value: unknown): InvoiceItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) => {
    if (!v || typeof v !== "object") return [];
    const o = v as Record<string, unknown>;
    if (typeof o.description !== "string") return [];
    return [{ description: o.description, quantity: Number(o.quantity) || 0, unitAmount: Number(o.unitAmount) || 0 }];
  });
}

export type Party = { name: string; company?: string; email?: string; location?: string };
export function parseParty(value: unknown): Party {
  const o = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const str = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : "");
  return { name: str("name"), company: str("company"), email: str("email"), location: str("location") };
}
