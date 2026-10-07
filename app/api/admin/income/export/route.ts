import { NextResponse } from "next/server";
import { getT } from "@/lib/admin-lang-server";
import { EXPENSE_CATEGORIES, INCOME_SOURCES, toCsv } from "@/lib/income";
import { loadYear } from "@/lib/income-server";

export const dynamic = "force-dynamic";

/** CSV del año para el contador (ingresos y gastos). */
export async function GET(request: Request) {
  const { lang } = await getT();
  const raw = Number(new URL(request.url).searchParams.get("year"));
  const year = Number.isInteger(raw) && raw >= 2000 && raw <= 2100 ? raw : new Date().getUTCFullYear();
  const data = await loadYear(year);
  const en = lang === "en";
  const sourceLabel = (id: string) => INCOME_SOURCES.find((s) => s.id === id)?.[en ? "labelEn" : "label"] ?? id;
  const categoryLabel = (id: string) => EXPENSE_CATEGORIES.find((c) => c.id === id)?.[en ? "labelEn" : "label"] ?? id;
  const csv = toCsv(
    [
      ...data.income.map((i) => ({ date: i.date, type: "income" as const, category: sourceLabel(i.source), description: i.description, cents: i.cents })),
      ...data.expenses.map((e) => ({ date: e.date, type: "expense" as const, category: categoryLabel(e.category), description: e.description, cents: e.cents })),
    ],
    lang
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="foliocrew-${en ? "income-expenses" : "ingresos-gastos"}-${year}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
