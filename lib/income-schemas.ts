import { z } from "zod";
import { EXPENSE_CATEGORIES, INCOME_SOURCES, MAX_TAX_PERCENT } from "@/lib/income";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => !Number.isNaN(new Date(`${v}T12:00:00Z`).getTime()) && new Date(`${v}T12:00:00Z`).toISOString().startsWith(v));
const cents = z.number().int().min(1).max(100_000_000_00);

export const incomeSchema = z.object({
  date,
  amountCents: cents,
  source: z.enum(INCOME_SOURCES.map((s) => s.id) as [string, ...string[]]),
  description: z.string().trim().max(200).default(""),
});

export const expenseSchema = z.object({
  date,
  amountCents: cents,
  category: z.enum(EXPENSE_CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  description: z.string().trim().max(200).default(""),
  receiptUrl: z.union([z.literal(""), z.string().url().max(600).startsWith("https://")]).optional(),
});

export const taxSchema = z.object({ taxPercent: z.number().int().min(0).max(MAX_TAX_PERCENT) });
