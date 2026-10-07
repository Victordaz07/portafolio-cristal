import { prisma } from "@/lib/prisma";
import { getBillingProfile } from "@/lib/invoices-server";
import { isExpenseCategory, isIncomeSource, type ExpenseCategory, type IncomeItem, type IncomeSource, type MoneyItem } from "@/lib/income";

/** Un renglón mostrable: de una factura pagada («invoice») o anotado a mano («manual»). */
export interface IncomeRow extends IncomeItem {
  id: string;
  origin: "invoice" | "manual";
  description: string;
}
export interface ExpenseRow extends MoneyItem {
  id: string;
  category: ExpenseCategory;
  description: string;
  receiptUrl: string | null;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Ingresos y gastos del año. Las facturas pagadas (en dólares) cuentan solas como ingreso de «Marcas»,
 * con la fecha en que se pagaron; las de otra moneda no se suman (se avisa cuántas quedan fuera).
 */
export async function loadYear(year: number) {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const [invoices, entries, expenses, profile] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: "paid", paidAt: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } },
      select: { id: true, number: true, subtotal: true, currency: true, paidAt: true, billTo: true },
    }),
    prisma.incomeEntry.findMany({ where: { date: { gte: from, lte: to } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    prisma.expense.findMany({ where: { date: { gte: from, lte: to } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    getBillingProfile(),
  ]);
  const usdInvoices = invoices.filter((i) => i.currency === "USD" && i.paidAt);
  const skipped = invoices.length - usdInvoices.length;
  const income: IncomeRow[] = [
    ...usdInvoices.map((i) => {
      const billTo = (i.billTo ?? {}) as { name?: string; company?: string };
      return { id: i.id, origin: "invoice" as const, date: dayKey(i.paidAt as Date), cents: i.subtotal, source: "brand" as IncomeSource, description: `${i.number}${billTo.company || billTo.name ? ` · ${billTo.company || billTo.name}` : ""}` };
    }),
    ...entries.map((e) => ({ id: e.id, origin: "manual" as const, date: e.date, cents: e.amountCents, source: (isIncomeSource(e.source) ? e.source : "other") as IncomeSource, description: e.description })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const expenseRows: ExpenseRow[] = expenses.map((e) => ({
    id: e.id,
    date: e.date,
    cents: e.amountCents,
    category: (isExpenseCategory(e.category) ? e.category : "other") as ExpenseCategory,
    description: e.description,
    receiptUrl: e.receiptUrl,
  }));
  return { income, expenses: expenseRows, taxPercent: profile.taxPercent, skippedInvoices: skipped };
}
