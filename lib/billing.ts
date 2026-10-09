import { PLANS, type Plan } from "./plans";

// Cobro manual (sin Stripe por ahora): la persona paga por PayPal o transferencia y avisa;
// quien administra Foliocrew confirma el pago y el plan queda pagado hasta una fecha.
//
// Variables (Vercel):
//   PAYPAL_URL          enlace de PayPal.me, p. ej. https://paypal.me/foliocrew (se le agrega el monto)
//   BANK_TRANSFER_INFO  datos de la transferencia (banco, titular, cuenta…); usa \n para saltos de línea
//   TRIAL_DAYS          días de prueba gratis de las cuentas nuevas (14 si no se define; 0 = sin prueba)

export const PAYMENT_METHODS = {
  paypal: "PayPal",
  transfer: "Transferencia bancaria",
  other: "Otro",
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const PAYMENT_METHODS_EN: Record<PaymentMethod, string> = { paypal: "PayPal", transfer: "Bank transfer", other: "Other" };

/** Nombre del método de pago en el idioma del panel. */
export const paymentMethodLabel = (method: string, lang: "es" | "en" = "es") =>
  (lang === "en" ? PAYMENT_METHODS_EN : PAYMENT_METHODS)[method as PaymentMethod] ?? method;

/** Planes que se pueden pagar desde el panel (Crew se arma a la medida). */
export const PAYABLE_PLANS = PLANS.filter((p) => p.id !== "crew");
export const PERIODS = [1, 3, 12] as const;

export function trialDays() {
  const n = Number(process.env.TRIAL_DAYS ?? 14);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 14;
}

export function getPlan(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[1];
}

/** Precio en centavos de USD: 12 meses = 10 meses (2 de regalo). */
export function priceCents(planId: string, months: number) {
  const monthly = getPlan(planId).price * 100;
  return months >= 12 ? monthly * 10 * Math.floor(months / 12) + monthly * (months % 12) : monthly * months;
}

/** "US$19" o "US$9.50" (como se escribe en Latinoamérica). */
export function formatMoney(cents: number, currency = "USD") {
  const amount = (cents / 100).toLocaleString("es-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
  return currency === "USD" ? `US$${amount}` : `${amount} ${currency}`;
}

export interface BillingFields {
  plan: string;
  comp: boolean;
  /** Embajadora de Foliocrew: Folio Pro sin pagar y sin vencer (docs/plan-embajadores.md). */
  ambassador?: boolean;
  trialEndsAt: Date | null;
  paidUntil: Date | null;
}

export type BillingState = "comp" | "ambassador" | "active" | "trial" | "expired" | "none" | "agency";

export const BILLING_LABEL: Record<BillingState, string> = {
  comp: "Cortesía",
  ambassador: "Embajadora",
  active: "Pagado",
  trial: "Prueba gratis",
  expired: "Vencido",
  none: "Sin plan",
  agency: "Administrada por tu agencia",
};

export const BILLING_LABEL_EN: Record<BillingState, string> = {
  comp: "Complimentary",
  ambassador: "Ambassador",
  active: "Paid",
  trial: "Free trial",
  expired: "Expired",
  none: "No plan",
  agency: "Managed by your agency",
};

/** Estado del plan en el idioma del panel. */
export const billingLabel = (state: BillingState, lang: "es" | "en" = "es") => (lang === "en" ? BILLING_LABEL_EN : BILLING_LABEL)[state];

/**
 * Estado del plan de una creadora, mirando primero si la administra una agencia (plan Crew): ahí
 * su propia facturación (trialEndsAt/paidUntil/comp) no se usa — paga la agencia, una sola vez.
 */
export function creatorBillingState(c: BillingFields & { agencyId?: string | null }, now = new Date()) {
  if (c.agencyId) return { state: "agency" as BillingState, until: null, daysLeft: null };
  return billingState(c, now);
}

/** Estado del plan hoy y hasta cuándo dura. */
export function billingState(c: BillingFields, now = new Date()) {
  if (c.comp) return { state: "comp" as BillingState, until: null, daysLeft: null };
  if (c.ambassador) return { state: "ambassador" as BillingState, until: null, daysLeft: null };
  if (c.paidUntil && c.paidUntil > now) return { state: "active" as BillingState, until: c.paidUntil, daysLeft: daysBetween(now, c.paidUntil) };
  if (c.trialEndsAt && c.trialEndsAt > now) return { state: "trial" as BillingState, until: c.trialEndsAt, daysLeft: daysBetween(now, c.trialEndsAt) };
  const ended = c.paidUntil ?? c.trialEndsAt;
  if (ended) return { state: "expired" as BillingState, until: ended, daysLeft: -daysBetween(ended, now) };
  return { state: "none" as BillingState, until: null, daysLeft: null };
}

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / 86_400_000);
}

/** Nuevo "pagado hasta": suma los meses desde hoy o desde el vencimiento actual, lo que sea más tarde. */
export function extendPaidUntil(current: Date | null, months: number, now = new Date()) {
  const start = current && current > now ? new Date(current) : new Date(now);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + months);
  return end;
}

/** Referencia que la persona pone en el concepto del pago, para reconocerlo. */
export function paymentReference(slug: string) {
  return `FC-${slug.toUpperCase()}`;
}

export function paymentInstructions() {
  const paypal = (process.env.PAYPAL_URL || "").trim().replace(/\/$/, "");
  const transfer = (process.env.BANK_TRANSFER_INFO || "").replace(/\\n/g, "\n").trim();
  return { paypal: paypal || null, transfer: transfer || null };
}
