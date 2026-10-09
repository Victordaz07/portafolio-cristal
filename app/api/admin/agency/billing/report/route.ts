import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser } from "@/lib/agency";
import { notifyAgencyPaymentReported } from "@/lib/agency-billing-server";
import { PAYMENT_METHODS } from "@/lib/billing";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

// Crew es a la medida (negociado, no autopagable — ver lib/billing.ts PAYABLE_PLANS), así que la
// agencia escribe el monto que acordó, en vez de calcularlo de un precio fijo por mes.
const schema = z.object({
  months: z.union([z.literal(1), z.literal(3), z.literal(12)]),
  amountCents: z.number().int().positive().max(100_000_00),
  method: z.enum(Object.keys(PAYMENT_METHODS) as [string, ...string[]]),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});

/** La agencia avisa "ya pagué" (PayPal o transferencia, ver docs/pagos.md). Un dueño lo confirma. */
export async function POST(request: Request) {
  const { t } = await getT();
  const agency = await agencyUser();
  if (!agency || !agency.owner) return NextResponse.json({ error: t("Solo para el dueño de la agencia", "Agency owner only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });

  const payment = await prismaRoot.agencyPayment.create({
    data: {
      agencyId: agency.agencyId,
      months: parsed.data.months,
      amountCents: parsed.data.amountCents,
      method: parsed.data.method,
      reference: parsed.data.reference,
      note: parsed.data.note,
    },
  });
  await notifyAgencyPaymentReported(payment.id);
  return NextResponse.json({ ok: true });
}
