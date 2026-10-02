import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { DEAL_STATUSES, PAYMENT_STATUSES, DEAL_STATUS_META, PAYMENT_STATUS_META, dateInputToDate } from "@/lib/crm";

// Lo que el panel de Marcas necesita de cada marca: historial y publicaciones vinculadas.
export const brandCrmInclude = {
  events: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
  contentCards: {
    orderBy: { createdAt: "desc" },
    select: { id: true, caption: true, platform: true, createdAt: true },
  },
} satisfies Prisma.BrandInclude;

export type BrandWithCrm = Prisma.BrandGetPayload<{ include: typeof brandCrmInclude }>;

const optionalText = z.string().trim().max(2000).nullable().optional();
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional()
  .or(z.literal(""));

export const brandFieldsSchema = z.object({
  name: z.string().trim().min(1).optional(),
  logoUrl: z.string().url().nullable().optional().or(z.literal("")),
  websiteUrl: z.string().url().nullable().optional().or(z.literal("")),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
  dealStatus: z.enum(DEAL_STATUSES).nullable().optional(),
  contactName: optionalText,
  contactEmail: z.string().trim().email().nullable().optional().or(z.literal("")),
  dealValue: z.number().int().min(0).nullable().optional(),
  packageDetail: optionalText,
  platforms: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).nullable().optional(),
  nextAction: optionalText,
  nextActionDue: optionalDate,
  lastContactAt: optionalDate,
  notes: optionalText,
});

export type BrandFieldsInput = z.infer<typeof brandFieldsSchema>;

/** Convierte la entrada validada en datos de Prisma: "" → null y fechas "YYYY-MM-DD" → Date. */
export function toBrandData(input: BrandFieldsInput) {
  const { nextActionDue, lastContactAt, ...rest } = input;
  const data: Prisma.BrandUncheckedUpdateInput = { ...rest };
  for (const key of ["logoUrl", "websiteUrl", "contactEmail", "contactName", "packageDetail", "nextAction", "notes"] as const) {
    if (data[key] === "") data[key] = null;
  }
  if (nextActionDue !== undefined) data.nextActionDue = nextActionDue ? dateInputToDate(nextActionDue) : null;
  if (lastContactAt !== undefined) data.lastContactAt = lastContactAt ? dateInputToDate(lastContactAt) : null;
  return data;
}

/** Entradas automáticas del historial cuando cambia el estado del trato o del pago. */
export function autoEventNotes(
  before: { dealStatus: string | null; paymentStatus: string | null },
  input: BrandFieldsInput
) {
  const notes: string[] = [];
  if (input.dealStatus !== undefined && input.dealStatus !== before.dealStatus) {
    notes.push(
      input.dealStatus
        ? `Estado: ${DEAL_STATUS_META[input.dealStatus].label}`
        : "Trato quitado (solo portafolio)"
    );
  }
  if (input.paymentStatus !== undefined && input.paymentStatus !== before.paymentStatus && input.paymentStatus) {
    notes.push(`Pago: ${PAYMENT_STATUS_META[input.paymentStatus].label}`);
  }
  return notes;
}
