// Reseñas anónimas de marcas (E1). Lógica pura (se prueba en tests/brand-reviews.test.ts).
// Principios: solo hechos (¿pagó a tiempo?, ¿cuánto tardó?, ¿cómo fue el trato?), nunca el nombre de quien reseña,
// y nada se muestra de una marca hasta que tenga al menos 3 reseñas de personas distintas.

/** Con menos reseñas distintas no se muestra nada de la marca (protege el anonimato). */
export const MIN_REVIEWS = 3;
export const MAX_COMMENT = 500;
export const MAX_REPLY = 800;
/** Reseñas nuevas que una cuenta puede escribir por día. */
export const DAILY_REVIEW_CAP = 10;
/** Días mínimos de antigüedad de la cuenta para poder reseñar. */
export const MIN_ACCOUNT_AGE_DAYS = 7;

export const PAYMENT_OPTIONS = [
  { id: "on_time", label: "Pagó a tiempo", labelEn: "Paid on time" },
  { id: "late", label: "Pagó tarde", labelEn: "Paid late" },
  { id: "unpaid", label: "No me pagó", labelEn: "Didn't pay" },
] as const;
export type PaymentOutcome = (typeof PAYMENT_OPTIONS)[number]["id"];
export const isPaymentOutcome = (v: string): v is PaymentOutcome => PAYMENT_OPTIONS.some((o) => o.id === v);

/** «Sol Skincare, Inc.» → «solskincareinc». Es la llave que junta las reseñas de una misma marca. */
export function normalizeBrandKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 60);
}

/** Correos, teléfonos y enlaces: el comentario es sobre el trato, no un medio para contactar a nadie. */
export function hasContactInfo(text: string) {
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text) || /https?:\/\/|www\./i.test(text)) return true;
  // Teléfono: una racha de números con separadores que suma 9 dígitos o más.
  return (text.match(/\d[\d\s().+-]{7,}\d/g) ?? []).some((run) => run.replace(/\D/g, "").length >= 9);
}

export interface ReviewInput {
  payment: string;
  payDays?: number | null;
  rating: number;
  comment?: string;
}

export type ReviewCheck =
  | { ok: true; payment: PaymentOutcome; payDays: number | null; rating: number; comment: string }
  | { ok: false; reason: "payment" | "payDays" | "rating" | "comment" | "contact" };

export function validateReview(input: ReviewInput): ReviewCheck {
  if (!isPaymentOutcome(input.payment)) return { ok: false, reason: "payment" };
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return { ok: false, reason: "rating" };
  const comment = (input.comment ?? "").trim();
  if (comment.length > MAX_COMMENT) return { ok: false, reason: "comment" };
  if (comment && hasContactInfo(comment)) return { ok: false, reason: "contact" };
  let payDays: number | null = null;
  if (input.payment !== "unpaid" && input.payDays != null) {
    if (!Number.isInteger(input.payDays) || input.payDays < 0 || input.payDays > 365) return { ok: false, reason: "payDays" };
    payDays = input.payDays;
  }
  return { ok: true, payment: input.payment, payDays, rating: input.rating, comment };
}

export interface ReviewRow {
  reviewerId: string;
  payment: string;
  payDays: number | null;
  rating: number;
  comment: string;
  commentStatus: string;
}

export interface BrandSummary {
  /** false = todavía no hay suficientes reseñas: no se muestra nada. */
  visible: boolean;
  count?: number;
  avgRating?: number;
  onTimePct?: number;
  latePct?: number;
  unpaidPct?: number;
  medianPayDays?: number | null;
  /** Comentarios ya aprobados por el equipo, sin autor ni fecha. */
  comments?: string[];
}

function median(values: number[]) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/** Resumen de una marca. Solo cuenta una reseña por persona y no muestra nada con menos de MIN_REVIEWS. */
export function summarizeBrand(rows: ReviewRow[]): BrandSummary {
  const byReviewer = new Map<string, ReviewRow>();
  for (const r of rows) byReviewer.set(r.reviewerId, r);
  const list = Array.from(byReviewer.values());
  if (list.length < MIN_REVIEWS) return { visible: false };
  const pct = (n: number) => Math.round((n / list.length) * 100);
  return {
    visible: true,
    count: list.length,
    avgRating: Math.round((list.reduce((a, r) => a + r.rating, 0) / list.length) * 10) / 10,
    onTimePct: pct(list.filter((r) => r.payment === "on_time").length),
    latePct: pct(list.filter((r) => r.payment === "late").length),
    unpaidPct: pct(list.filter((r) => r.payment === "unpaid").length),
    medianPayDays: median(list.filter((r) => r.payment !== "unpaid" && r.payDays != null).map((r) => r.payDays as number)),
    // Se ordenan por texto para que el orden no delate cuál reseña llegó primero.
    comments: list.filter((r) => r.commentStatus === "approved" && r.comment).map((r) => r.comment).sort((a, b) => a.localeCompare(b)),
  };
}

export interface Eligibility {
  emailVerified: boolean;
  accountCreatedAt: Date;
  active: boolean;
  muted: boolean;
}

/** Quién puede reseñar: cuenta activa, con correo verificado, con cierta antigüedad y sin sanción. */
export function canReview(e: Eligibility, now: Date = new Date()): { ok: true } | { ok: false; reason: "email" | "age" | "inactive" | "muted" } {
  if (!e.active) return { ok: false, reason: "inactive" };
  if (e.muted) return { ok: false, reason: "muted" };
  if (!e.emailVerified) return { ok: false, reason: "email" };
  const ageDays = (now.getTime() - e.accountCreatedAt.getTime()) / 86_400_000;
  if (ageDays < MIN_ACCOUNT_AGE_DAYS) return { ok: false, reason: "age" };
  return { ok: true };
}

/** Solo se reseña a marcas con las que hubo trato de verdad (activo o completado), no a una lista de deseos. */
export const REVIEWABLE_DEAL_STATUSES = ["active", "completed"] as const;
