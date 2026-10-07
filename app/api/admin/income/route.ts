import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { incomeSchema } from "@/lib/income-schemas";

export const dynamic = "force-dynamic";

/** Anota un ingreso a mano (afiliados, plataformas, productos…). Las facturas pagadas ya cuentan solas. */
export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = incomeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa la fecha y el monto", "Check the date and the amount") }, { status: 400 });
  const entry = await prisma.incomeEntry.create({ data: parsed.data });
  return NextResponse.json(entry, { status: 201 });
}
