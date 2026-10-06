import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { parseParty } from "@/lib/invoices";
import { emailInvoiceToBrand, getBillingProfile, syncBrandPayment } from "@/lib/invoices-server";

export const dynamic = "force-dynamic";

/** Envía (o reenvía) la factura a la marca por correo con su enlace. Un borrador pasa a "enviada". */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const session = await getSession();
  if (session?.actorId) return NextResponse.json({ error: t("El equipo no envía facturas en nombre de una cuenta", "The team doesn't send invoices on behalf of an account") }, { status: 403 });
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: t("Factura no encontrada", "Invoice not found") }, { status: 404 });
  if (invoice.status === "void" || invoice.status === "paid") {
    return NextResponse.json({ error: t("Esta factura ya está cerrada", "This invoice is already closed") }, { status: 400 });
  }
  if (!parseParty(invoice.billTo).email) {
    return NextResponse.json({ error: t("Agrega el correo de la marca para enviarla", "Add the brand's email to send it") }, { status: 400 });
  }
  if (invoice.subtotal <= 0) return NextResponse.json({ error: t("La factura está en $0", "The invoice total is $0") }, { status: 400 });

  // Al enviar un borrador se toman tus datos para facturar de ese momento (por si los completaste después).
  let toSend = invoice;
  if (invoice.status === "draft") {
    const profile = await getBillingProfile();
    toSend = await prisma.invoice.update({
      where: { id },
      data: { issuer: { name: profile.legalName, location: profile.location, email: profile.email }, payTo: invoice.payTo || profile.payTo },
    });
  }
  const result = await emailInvoiceToBrand(toSend);
  const updated = await prisma.invoice.update({ where: { id }, data: { status: "sent", sentAt: invoice.sentAt ?? new Date() } });
  if (invoice.brandId && invoice.status === "draft") {
    await prisma.brandEvent.create({ data: { brandId: invoice.brandId, note: lang === "en" ? `Invoice ${invoice.number} sent` : `Factura ${invoice.number} enviada` } });
  }
  await syncBrandPayment(invoice.brandId);
  return NextResponse.json({ invoice: updated, emailed: result.sent });
}
