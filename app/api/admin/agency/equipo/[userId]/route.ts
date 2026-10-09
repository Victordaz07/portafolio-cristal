import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser, logAgencyAction } from "@/lib/agency";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

async function requireMember(agencyId: string, userId: string) {
  const user = await prismaRoot.adminUser.findUnique({ where: { id: userId }, select: { id: true, email: true, agencyId: true } });
  return user && user.agencyId === agencyId ? user : null;
}

const patchSchema = z.object({ role: z.enum(["owner", "cm"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { t } = await getT();
  const agency = await agencyUser();
  if (!agency || !agency.owner) return NextResponse.json({ error: t("Solo para el dueño de la agencia", "Agency owner only") }, { status: 403 });
  const { userId } = await params;
  const member = await requireMember(agency.agencyId, userId);
  if (!member) return NextResponse.json({ error: t("No encontrado", "Not found") }, { status: 404 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  await prismaRoot.adminUser.update({ where: { id: userId }, data: { agencyRole: parsed.data.role } });
  await logAgencyAction(agency.agencyId, agency.email, "role_change", null, `${member.email} → ${parsed.data.role}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { t } = await getT();
  const agency = await agencyUser();
  if (!agency || !agency.owner) return NextResponse.json({ error: t("Solo para el dueño de la agencia", "Agency owner only") }, { status: 403 });
  const { userId } = await params;
  const member = await requireMember(agency.agencyId, userId);
  if (!member) return NextResponse.json({ error: t("No encontrado", "Not found") }, { status: 404 });
  if (userId === agency.id) return NextResponse.json({ error: t("No puedes quitarte a ti mismo", "You can't remove yourself") }, { status: 400 });
  await prismaRoot.adminUser.update({ where: { id: userId }, data: { agencyId: null, agencyRole: null } });
  await logAgencyAction(agency.agencyId, agency.email, "role_change", null, `Quitado: ${member.email}`);
  return NextResponse.json({ ok: true });
}
