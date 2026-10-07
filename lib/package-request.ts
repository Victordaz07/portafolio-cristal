import { z } from "zod";

// Solicitar un paquete (C2): lógica pura. Se prueba en tests/package-request.test.ts.

type Lang = "es" | "en";

export const BUDGET_MAX = 1_000_000;

/** «Desde US$500» / «From US$500». Sin precio → null (no se muestra nada). */
export function formatPriceFrom(priceFrom: number | null | undefined, currency: string | null | undefined, lang: Lang) {
  if (priceFrom == null || priceFrom <= 0) return null;
  const amount = priceFrom.toLocaleString(lang === "en" ? "en-US" : "es-US", { maximumFractionDigits: 0 });
  const money = !currency || currency === "USD" ? `US$${amount}` : `${amount} ${currency}`;
  return lang === "en" ? `From ${money}` : `Desde ${money}`;
}

const isoDay = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "date");
const optionalDay = z.union([z.literal(""), isoDay]).optional();

export const packageRequestSchema = z
  .object({
    packageId: z.string().trim().min(1).max(60),
    brandName: z.string().trim().min(1).max(120),
    contactName: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(200),
    startDate: optionalDay,
    endDate: optionalDay,
    /** Presupuesto aproximado en la moneda del paquete (opcional). */
    budget: z.number().int().min(0).max(BUDGET_MAX).nullable().optional(),
    brief: z.string().trim().min(1).max(3000),
    /** Campo trampa para bots: las personas no lo ven ni lo llenan. */
    website: z.string().max(200).optional(),
    lang: z.enum(["es", "en"]).default("es"),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { path: ["endDate"], message: "range" });

export type PackageRequestInput = z.infer<typeof packageRequestSchema>;

/** Línea corta con lo que pidió la marca (para el detalle del paquete y el aviso). */
export function requestSummary(p: { packageName: string; budget?: number | null; currency?: string | null; startDate?: string; endDate?: string; lang: Lang }) {
  const en = p.lang === "en";
  const parts = [en ? `Package: ${p.packageName}` : `Paquete: ${p.packageName}`];
  if (p.budget != null && p.budget > 0) {
    const money = !p.currency || p.currency === "USD" ? `US$${p.budget.toLocaleString(en ? "en-US" : "es-US")}` : `${p.budget.toLocaleString(en ? "en-US" : "es-US")} ${p.currency}`;
    parts.push(en ? `Budget: ${money}` : `Presupuesto: ${money}`);
  }
  if (p.startDate && p.endDate) parts.push(en ? `Dates: ${p.startDate} to ${p.endDate}` : `Fechas: del ${p.startDate} al ${p.endDate}`);
  else if (p.startDate) parts.push(en ? `Start: ${p.startDate}` : `Inicio: ${p.startDate}`);
  else if (p.endDate) parts.push(en ? `Deadline: ${p.endDate}` : `Entrega: ${p.endDate}`);
  return parts.join(" · ");
}

/** El estado del trato después de una solicitud: lo que está en pausa o terminado vuelve a negociación; lo demás no se toca. */
export function dealStatusAfterRequest(current: string | null | undefined) {
  return !current || current === "prospect" || current === "completed" ? "negotiating" : current;
}
