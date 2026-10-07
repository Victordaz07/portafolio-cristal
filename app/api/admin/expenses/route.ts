import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { expenseSchema } from "@/lib/income-schemas";

export const dynamic = "force-dynamic";

/** Anota un gasto del negocio (con la foto del recibo si la subiste). */
export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = expenseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa la fecha y el monto", "Check the date and the amount") }, { status: 400 });
  const { receiptUrl, ...rest } = parsed.data;
  const expense = await prisma.expense.create({ data: { ...rest, receiptUrl: receiptUrl || null } });
  return NextResponse.json(expense, { status: 201 });
}
