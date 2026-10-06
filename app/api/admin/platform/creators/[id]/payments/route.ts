import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { platformAdminUser } from "@/lib/platform-admin";
import { PLANS } from "@/lib/plans";
import { priceCents } from "@/lib/billing";
import { confirmPayment } from "@/lib/billing-server";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(PLANS.map((p) => p.id) as [string, ...string[]]),
  months: z.number().int().min(1).max(36),
  /** Monto recibido en USD (si no viene, el precio de lista). */
  amount: z.number().min(0).max(100000).optional(),
  method: z.enum(["paypal", "transfer", "other"]),
  reference: z.string().trim().max(120).optional(),
});

/** Registrar un pago que ya recibiste (PayPal, transferencia, efectivo…): queda confirmado. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const admin = await platformAdminUser();
  if (!admin) return NextResponse.json({ error: t("Solo para quien administra Foliocrew", "Foliocrew admins only") }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos del pago", "Check the payment details") }, { status: 400 });
  const { plan, months, amount, method, reference } = parsed.data;
  if (!(await prismaRoot.creator.findUnique({ where: { id }, select: { id: true } }))) {
    return NextResponse.json({ error: t("La cuenta no existe", "The account doesn't exist") }, { status: 404 });
  }
  const payment = await prismaRoot.payment.create({
    data: {
      creatorId: id,
      plan,
      months,
      method,
      amountCents: amount !== undefined ? Math.round(amount * 100) : priceCents(plan, months),
      reference: reference || null,
      note: `Registrado por ${admin.email}`,
    },
  });
  const paidUntil = await confirmPayment(payment.id, admin.email);
  return NextResponse.json({ ok: true, paidUntil });
}
