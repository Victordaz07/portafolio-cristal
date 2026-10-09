import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser, logAgencyAction } from "@/lib/agency";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email(), role: z.enum(["owner", "cm"]) });

/** Suma a alguien al equipo de la agencia. Tiene que tener ya una cuenta de Foliocrew con ese correo. */
export async function POST(request: Request) {
  const { t } = await getT();
  const agency = await agencyUser();
  if (!agency || !agency.owner) return NextResponse.json({ error: t("Solo para el dueño de la agencia", "Agency owner only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const user = await prismaRoot.adminUser.findUnique({ where: { email }, select: { id: true, agencyId: true } });
  if (!user) return NextResponse.json({ error: t("Esa persona todavía no tiene cuenta en Foliocrew. Pídele que se registre primero.", "That person doesn't have a Foliocrew account yet. Ask them to sign up first.") }, { status: 404 });
  if (user.agencyId && user.agencyId !== agency.agencyId) return NextResponse.json({ error: t("Esa cuenta ya es de otra agencia", "That account already belongs to another agency") }, { status: 400 });

  await prismaRoot.adminUser.update({ where: { id: user.id }, data: { agencyId: agency.agencyId, agencyRole: parsed.data.role } });
  await logAgencyAction(agency.agencyId, agency.email, "role_change", null, `Sumado: ${email} (${parsed.data.role})`);
  return NextResponse.json({ ok: true });
}
