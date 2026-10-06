import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { contractActionSchema, contractFieldsSchema } from "@/lib/contract-schemas";
import { buildContract } from "@/lib/contracts-server";

export const dynamic = "force-dynamic";

/**
 * Editar un borrador (se vuelve a generar el texto), o retirar un contrato enviado, o reabrir uno
 * en el que la marca pidió cambios. Un contrato aceptado ya no se toca.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: t("Acuerdo no encontrado", "Agreement not found") }, { status: 404 });
  if (contract.status === "accepted") {
    return NextResponse.json({ error: t("Un acuerdo aceptado ya no se puede cambiar", "An accepted agreement can no longer be changed") }, { status: 400 });
  }

  const action = contractActionSchema.safeParse(body);
  if (action.success) {
    const ok = action.data.action === "withdraw" ? contract.status === "sent" : contract.status === "declined";
    if (!ok) return NextResponse.json({ error: t("Este acuerdo no está en un estado que permita eso", "This agreement isn't in a state that allows that") }, { status: 400 });
    const updated = await prisma.contract.update({
      where: { id },
      data: { status: "draft", sentAt: null, viewedAt: null, declinedAt: null, declineReason: null },
    });
    return NextResponse.json(updated);
  }

  if (contract.status !== "draft") {
    return NextResponse.json({ error: t("Primero retira el acuerdo para editarlo", "Withdraw the agreement first to edit it") }, { status: 400 });
  }
  const parsed = contractFieldsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos del contrato", "Check the agreement details") }, { status: 400 });
  if (parsed.data.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: parsed.data.brandId }, select: { id: true } });
    if (!brand) return NextResponse.json({ error: t("Marca no encontrada", "Brand not found") }, { status: 404 });
  }
  const { title, bodyText } = buildContract(parsed.data);
  const updated = await prisma.contract.update({
    where: { id },
    data: {
      brandId: parsed.data.brandId || null,
      template: parsed.data.terms.template,
      language: parsed.data.language,
      title,
      terms: parsed.data.terms,
      parties: parsed.data.parties,
      bodyText,
    },
  });
  return NextResponse.json(updated);
}

/** Borrar: solo borradores. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const contract = await prisma.contract.findUnique({ where: { id }, select: { status: true } });
  if (!contract) return NextResponse.json({ error: t("Acuerdo no encontrado", "Agreement not found") }, { status: 404 });
  if (contract.status !== "draft") return NextResponse.json({ error: t("Solo se borran los borradores", "Only drafts can be deleted") }, { status: 400 });
  await prisma.contract.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
