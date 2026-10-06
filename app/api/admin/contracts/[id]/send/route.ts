import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { emailContractToBrand } from "@/lib/contracts-server";

export const dynamic = "force-dynamic";

/** Envía (o reenvía) el contrato a la marca por correo con su enlace. Un borrador pasa a "enviado". */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const session = await getSession();
  if (session?.actorId) return NextResponse.json({ error: t("El equipo no envía acuerdos en nombre de una cuenta", "The team doesn't send agreements on behalf of an account") }, { status: 403 });
  const { id } = await params;
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: t("Acuerdo no encontrado", "Agreement not found") }, { status: 404 });
  if (contract.status === "accepted" || contract.status === "declined") {
    return NextResponse.json({ error: t("Este acuerdo ya tiene respuesta de la marca", "The brand already responded to this agreement") }, { status: 400 });
  }
  const parties = contract.parties as { brand?: { email?: string } } | null;
  if (!parties?.brand?.email) return NextResponse.json({ error: t("Agrega el correo de la marca para enviarlo", "Add the brand's email to send it") }, { status: 400 });

  const result = await emailContractToBrand(contract);
  const updated = await prisma.contract.update({ where: { id }, data: { status: "sent", sentAt: contract.sentAt ?? new Date() } });
  if (contract.brandId && contract.status === "draft") {
    await prisma.brandEvent.create({ data: { brandId: contract.brandId, note: lang === "en" ? `Agreement sent: ${contract.title}` : `Acuerdo enviado: ${contract.title}` } });
  }
  return NextResponse.json({ contract: updated, emailed: result.sent });
}
