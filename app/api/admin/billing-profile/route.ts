import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { billingProfileSchema } from "@/lib/invoice-schemas";
import { getBillingProfile } from "@/lib/invoices-server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getBillingProfile());
}

/** Guarda los datos para facturar (nombre, ciudad, correo, cómo pagar, plazo, anticipo, prefijo). */
export async function PUT(request: Request) {
  const { t } = await getT();
  const parsed = billingProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos", "Check the details") }, { status: 400 });
  const profile = await getBillingProfile();
  const updated = await prisma.billingProfile.update({
    where: { id: profile.id },
    data: { ...parsed.data, invoicePrefix: (parsed.data.invoicePrefix || "FC").toUpperCase() },
  });
  return NextResponse.json(updated);
}
