// Ingresos e impuestos (C5). Lógica pura (se prueba en tests/income.test.ts). No es asesoría fiscal.

export const INCOME_SOURCES = [
  { id: "brand", label: "Marcas", labelEn: "Brands" },
  { id: "affiliate", label: "Afiliados", labelEn: "Affiliates" },
  { id: "platform", label: "Plataformas", labelEn: "Platforms" },
  { id: "product", label: "Productos", labelEn: "Products" },
  { id: "other", label: "Otros", labelEn: "Other" },
] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number]["id"];
export const isIncomeSource = (v: string): v is IncomeSource => INCOME_SOURCES.some((s) => s.id === v);

export const EXPENSE_CATEGORIES = [
  { id: "equipment", label: "Equipo", labelEn: "Equipment" },
  { id: "software", label: "Software y apps", labelEn: "Software & apps" },
  { id: "production", label: "Producción y utilería", labelEn: "Production & props" },
  { id: "travel", label: "Viajes", labelEn: "Travel" },
  { id: "ads", label: "Publicidad", labelEn: "Advertising" },
  { id: "fees", label: "Comisiones y tarifas", labelEn: "Fees" },
  { id: "other", label: "Otros", labelEn: "Other" },
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["id"];
export const isExpenseCategory = (v: string): v is ExpenseCategory => EXPENSE_CATEGORIES.some((c) => c.id === v);

export const DEFAULT_TAX_PERCENT = 25;
export const MAX_TAX_PERCENT = 60;

/** Una línea de ingreso (de una factura pagada o anotada a mano) o de gasto, en centavos de USD. */
export interface MoneyItem {
  /** "YYYY-MM-DD" */
  date: string;
  cents: number;
}
export interface IncomeItem extends MoneyItem {
  source: IncomeSource;
}

export interface MonthRow {
  /** 1–12 */
  month: number;
  income: number;
  expenses: number;
  net: number;
}

export interface YearSummary {
  year: number;
  months: MonthRow[];
  bySource: Record<IncomeSource, number>;
  byCategory: Record<ExpenseCategory, number>;
  income: number;
  expenses: number;
  net: number;
}

const inYear = (date: string, year: number) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number(date.slice(0, 4)) === year;

export function summarizeYear(incomes: IncomeItem[], expenses: (MoneyItem & { category: ExpenseCategory })[], year: number): YearSummary {
  const months: MonthRow[] = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expenses: 0, net: 0 }));
  const bySource = Object.fromEntries(INCOME_SOURCES.map((s) => [s.id, 0])) as Record<IncomeSource, number>;
  const byCategory = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.id, 0])) as Record<ExpenseCategory, number>;
  for (const i of incomes) {
    if (!inYear(i.date, year) || !Number.isFinite(i.cents) || i.cents <= 0) continue;
    months[Number(i.date.slice(5, 7)) - 1].income += i.cents;
    bySource[i.source] += i.cents;
  }
  for (const e of expenses) {
    if (!inYear(e.date, year) || !Number.isFinite(e.cents) || e.cents <= 0) continue;
    months[Number(e.date.slice(5, 7)) - 1].expenses += e.cents;
    byCategory[e.category] += e.cents;
  }
  for (const m of months) m.net = m.income - m.expenses;
  const income = months.reduce((a, m) => a + m.income, 0);
  const exp = months.reduce((a, m) => a + m.expenses, 0);
  return { year, months, bySource, byCategory, income, expenses: exp, net: income - exp };
}

/** Lo que conviene apartar: % de la ganancia (ingresos − gastos). Nunca negativo. */
export function taxReserve(netCents: number, percent: number) {
  const p = Number.isFinite(percent) ? Math.min(MAX_TAX_PERCENT, Math.max(0, percent)) : DEFAULT_TAX_PERCENT;
  return netCents > 0 ? Math.round((netCents * p) / 100) : 0;
}

/** Fechas habituales de pago trimestral de impuestos estimados en EE. UU. (el día 15; si cae en fin de semana se corre al lunes). */
const QUARTERLY: { month: number; label: string; labelEn: string }[] = [
  { month: 1, label: "enero", labelEn: "January" },
  { month: 4, label: "abril", labelEn: "April" },
  { month: 6, label: "junio", labelEn: "June" },
  { month: 9, label: "septiembre", labelEn: "September" },
];

function dueDate(year: number, month: number) {
  const d = new Date(Date.UTC(year, month - 1, 15));
  const dow = d.getUTCDay();
  if (dow === 6) d.setUTCDate(17);
  if (dow === 0) d.setUTCDate(16);
  return d;
}

/** Próxima fecha trimestral a partir de `now`, con los días que faltan. */
export function nextQuarterlyDate(now: Date) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (const year of [now.getUTCFullYear(), now.getUTCFullYear() + 1]) {
    for (const q of QUARTERLY) {
      const due = dueDate(year, q.month);
      if (due.getTime() >= today) return { date: due, days: Math.round((due.getTime() - today) / 86_400_000), label: q.label, labelEn: q.labelEn };
    }
  }
  throw new Error("unreachable");
}

/** Protege contra «inyección de fórmulas» al abrir el CSV en Excel/Sheets. */
export function csvCell(value: string | number) {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export interface CsvRow {
  date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  cents: number;
}

/** CSV para el contador: ingresos y gastos del año, un renglón cada uno, en dólares con dos decimales. */
export function toCsv(rows: CsvRow[], lang: "es" | "en" = "es") {
  const head = lang === "en" ? ["Date", "Type", "Category", "Description", "Amount (USD)"] : ["Fecha", "Tipo", "Categoría", "Descripción", "Monto (USD)"];
  const type = (t: CsvRow["type"]) => (lang === "en" ? (t === "income" ? "Income" : "Expense") : t === "income" ? "Ingreso" : "Gasto");
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
  const lines = sorted.map((r) => [r.date, type(r.type), r.category, r.description, (r.cents / 100).toFixed(2)].map(csvCell).join(","));
  return `﻿${[head.map(csvCell).join(","), ...lines].join("\r\n")}\r\n`;
}

/** "12.50", "12,5", "$1,200.00" → 1250 centavos (null si no es un monto válido y positivo). */
export function parseAmount(input: string) {
  const cleaned = input.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  const lastComma = cleaned.lastIndexOf(","), lastDot = cleaned.lastIndexOf(".");
  const decimalAt = Math.max(lastComma, lastDot);
  const digitsAfter = decimalAt >= 0 ? cleaned.length - decimalAt - 1 : 0;
  const hasDecimals = decimalAt >= 0 && digitsAfter > 0 && digitsAfter <= 2;
  const whole = (hasDecimals ? cleaned.slice(0, decimalAt) : cleaned).replace(/[.,]/g, "");
  const frac = hasDecimals ? cleaned.slice(decimalAt + 1).padEnd(2, "0") : "00";
  const cents = Number(whole || "0") * 100 + Number(frac);
  return Number.isFinite(cents) && cents > 0 && cents <= 100_000_000_00 ? cents : null;
}
