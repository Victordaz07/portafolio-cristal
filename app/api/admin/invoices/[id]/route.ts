import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { dateInputToDate } from "@/lib/crm";
import { itemsTotal } from "@/lib/invoices";
import { invoiceActionSchema, invoiceFieldsSchema } from "@/lib/invoice-schemas";
import { syncBrandPayment } from "@/lib/invoices-server";

export const dynamic = "force-dynamic";

/**
 * Editar una factura en borrador, o una acción sobre cualquier factura:
 * marcar pagada / no pagada, o anular.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: t("Factura no encontrada", "Invoice not found") }, { status: 404 });

  const action = invoiceActionSchema.safeParse(body);
  if (action.success) {
    const data: Prisma.InvoiceUncheckedUpdateInput =
      action.data.action === "markPaid"
        ? { status: "paid", paidAt: new Date() }
        : action.data.action === "markUnpaid"
          ? { status: invoice.sentAt ? "sent" : "draft", paidAt: null }
          : { status: "void" };
    if (action.data.action === "markPaid" && invoice.status === "void") {
      return NextResponse.json({ error: t("Esta factura está anulada", "This invoice is void") }, { status: 400 });
    }
    const updated = await prisma.invoice.update({ where: { id }, data });
    if (invoice.brandId && action.data.action !== "markUnpaid") {
      const note =
        action.data.action === "markPaid"
          ? lang === "en" ? `Invoice ${invoice.number} paid` : `Factura ${invoice.number} pagada`
          : lang === "en" ? `Invoice ${invoice.number} voided` : `Factura ${invoice.number} anulada`;
      await prisma.brandEvent.create({ data: { brandId: invoice.brandId, note } });
    }
    await syncBrandPayment(invoice.brandId);
    return NextResponse.json(updated);
  }

  if (invoice.status !== "draft") {
    return NextResponse.json({ error: t("Solo se puede editar una factura en borrador", "Only draft invoices can be edited") }, { status: 400 });
  }
  const parsed = invoiceFieldsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos de la factura", "Check the invoice details") }, { status: 400 });
  const { items, issuedAt, dueAt, brandId, ...rest } = parsed.data;
  if (brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } });
    if (!brand) return NextResponse.json({ error: t("Marca no encontrada", "Brand not found") }, { status: 404 });
  }
  const data: Prisma.InvoiceUncheckedUpdateInput = { ...rest };
  if (brandId !== undefined) data.brandId = brandId || null;
  if (items) {
    data.items = items;
    data.subtotal = itemsTotal(items);
  }
  if (issuedAt) data.issuedAt = dateInputToDate(issuedAt);
  if (dueAt) data.dueAt = dateInputToDate(dueAt);
  const updated = await prisma.invoice.update({ where: { id }, data });
  return NextResponse.json(updated);
}

/** Borrar: solo borradores (las enviadas se anulan, para no perder el consecutivo). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { status: true } });
  if (!invoice) return NextResponse.json({ error: t("Factura no encontrada", "Invoice not found") }, { status: 404 });
  if (invoice.status !== "draft") return NextResponse.json({ error: t("Una factura enviada no se borra: anúlala", "A sent invoice can't be deleted: void it") }, { status: 400 });
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
