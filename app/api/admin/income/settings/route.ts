import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { taxSchema } from "@/lib/income-schemas";
import { getBillingProfile } from "@/lib/invoices-server";

export const dynamic = "force-dynamic";

/** Guarda el % que la persona quiere apartar para impuestos. */
export async function PATCH(request: Request) {
  const { t } = await getT();
  const parsed = taxSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Elige un porcentaje entre 0 y 60", "Choose a percentage between 0 and 60") }, { status: 400 });
  const profile = await getBillingProfile();
  await prisma.billingProfile.update({ where: { id: profile.id }, data: { taxPercent: parsed.data.taxPercent } });
  return NextResponse.json({ ok: true });
}
