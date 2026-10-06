import { z } from "zod";

// Validación de lo que manda el panel al crear o editar un contrato, y de lo que manda la marca al aceptar.

const party = z.object({
  name: z.string().trim().max(200).default(""),
  company: z.string().trim().max(200).optional().default(""),
  location: z.string().trim().max(200).optional().default(""),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
});

export const contractTermsSchema = z.object({
  template: z.enum(["sponsored", "ugc", "ambassador", "affiliate"]),
  deliverables: z.array(z.string().trim().max(200)).max(30),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  /** Centavos */
  fee: z.number().int().min(0).max(100_000_000),
  currency: z.enum(["USD", "MXN", "EUR", "COP", "ARS", "CLP", "PEN", "DOP"]),
  depositPercent: z.number().int().min(0).max(100),
  paymentDays: z.number().int().min(0).max(180),
  months: z.number().int().min(0).max(36),
  commissionPercent: z.number().min(0).max(100),
  usageDays: z.number().int().min(0).max(3650),
  exclusivityDays: z.number().int().min(0).max(3650),
  exclusivityCategory: z.string().trim().max(120),
  whitelisting: z.boolean(),
  revisions: z.number().int().min(0).max(10),
  cancelNoticeDays: z.number().int().min(0).max(180),
  killFeePercent: z.number().int().min(0).max(100),
  extra: z.string().trim().max(3000),
});

export const contractFieldsSchema = z.object({
  brandId: z.string().min(1).max(40).nullable().optional(),
  language: z.enum(["es", "en"]),
  terms: contractTermsSchema,
  parties: z.object({ creator: party, brand: party }),
});

export const contractActionSchema = z.object({ action: z.enum(["withdraw", "reopen"]) });

export const acceptSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  agree: z.literal(true),
});

export const declineSchema = z.object({ reason: z.string().trim().max(1000).default("") });
