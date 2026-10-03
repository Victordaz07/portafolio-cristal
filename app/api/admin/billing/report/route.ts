import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { PAYABLE_PLANS, PERIODS, priceCents } from "@/lib/billing";
import { notifyPaymentReported } from "@/lib/billing-server";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(PAYABLE_PLANS.map((p) => p.id) as [string, ...string[]]),
  months: z.number().int().refine((m) => (PERIODS as readonly number[]).includes(m)),
  method: z.enum(["paypal", "transfer", "other"]),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});

/** "Ya pagué": la persona avisa que pagó por PayPal o transferencia; queda pendiente de confirmar. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (tooManyAttempts(`billing-report:${session.creatorId}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Ya enviaste varios avisos; te escribimos pronto" }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos del pago" }, { status: 400 });
  const { plan, months, method, reference, note } = parsed.data;
  const payment = await prisma.payment.create({
    data: { plan, months, method, amountCents: priceCents(plan, months), reference: reference || null, note: note || null },
  });
  await notifyPaymentReported(payment.id).catch((error) => console.error("No se pudo avisar del pago", error));
  return NextResponse.json({ ok: true, id: payment.id }, { status: 201 });
}
