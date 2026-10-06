import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { invoiceCreateSchema } from "@/lib/invoice-schemas";
import { createInvoice } from "@/lib/invoices-server";

export const dynamic = "force-dynamic";

/** Crea una factura en borrador (el número se asigna al crearla). */
export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = invoiceCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: t("Revisa la factura: falta a quién, qué cobras o la fecha", "Check the invoice: who it's for, what you're charging or the date is missing") }, { status: 400 });
  }
  if (parsed.data.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: parsed.data.brandId }, select: { id: true } });
    if (!brand) return NextResponse.json({ error: t("Marca no encontrada", "Brand not found") }, { status: 404 });
  }
  const invoice = await createInvoice(parsed.data);
  return NextResponse.json(invoice, { status: 201 });
}
