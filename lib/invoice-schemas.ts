import { z } from "zod";

// Validación de lo que manda el panel al crear o editar una factura y los datos para facturar.

const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.number().min(0.01).max(10_000),
  /** En centavos */
  unitAmount: z.number().int().min(0).max(100_000_000),
});

export const invoiceFieldsSchema = z.object({
  brandId: z.string().min(1).max(40).nullable().optional(),
  kind: z.enum(["full", "deposit", "balance"]).optional(),
  currency: z.enum(["USD", "MXN", "EUR", "COP", "ARS", "CLP", "PEN", "DOP"]).optional(),
  items: z.array(invoiceItemSchema).min(1).max(30).optional(),
  notes: z.string().trim().max(2000).optional(),
  payTo: z.string().trim().max(1000).optional(),
  billTo: z
    .object({
      name: z.string().trim().max(200),
      company: z.string().trim().max(200).optional().default(""),
      email: z.string().trim().email().or(z.literal("")).optional().default(""),
    })
    .optional(),
  language: z.enum(["es", "en"]).optional(),
  issuedAt: dateInput.optional(),
  dueAt: dateInput.optional(),
});

export const invoiceCreateSchema = invoiceFieldsSchema.required({ items: true, dueAt: true, billTo: true });

export const invoiceActionSchema = z.object({ action: z.enum(["markPaid", "markUnpaid", "void"]) });

export const billingProfileSchema = z.object({
  legalName: z.string().trim().max(200),
  location: z.string().trim().max(200),
  email: z.string().trim().email().or(z.literal("")),
  payTo: z.string().trim().max(1000),
  termsDays: z.number().int().min(0).max(180),
  depositPercent: z.number().int().min(0).max(100),
  invoicePrefix: z
    .string()
    .trim()
    .max(6)
    .regex(/^[A-Za-z0-9]*$/),
  defaultNotes: z.string().trim().max(2000),
});
