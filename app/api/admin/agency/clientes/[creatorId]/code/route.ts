import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser, logAgencyAction } from "@/lib/agency";
import { rotateAccessCode } from "@/lib/creators";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

/** Genera (rota) el código de acceso de una creadora de la cartera. Invalida el anterior. */
export async function POST(_request: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  const { t } = await getT();
  const agency = await agencyUser();
  if (!agency) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 403 });
  const { creatorId } = await params;
  const creator = await prismaRoot.creator.findUnique({ where: { id: creatorId }, select: { agencyId: true } });
  if (!creator || creator.agencyId !== agency.agencyId) return NextResponse.json({ error: t("Esa cuenta no es de tu cartera", "That account is not in your roster") }, { status: 403 });
  const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId }, orderBy: { createdAt: "asc" } });
  if (!owner) return NextResponse.json({ error: t("Esa cuenta no tiene usuario", "That account has no user") }, { status: 404 });
  const code = await rotateAccessCode(owner.id);
  await logAgencyAction(agency.agencyId, agency.email, "code_login", creatorId, "Código regenerado");
  return NextResponse.json({ accessCode: code });
}
