import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { withSession } from "@/lib/creators";
import { getSession } from "@/lib/tenant";
import { agencyUser, logAgencyAction } from "@/lib/agency";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({ creatorId: z.string().min(1) });

/** "Entrar a esta cuenta": una agencia (plan Crew) abre el panel de una creadora de su cartera. */
export async function POST(request: Request) {
  const { t } = await getT();
  const agency = await agencyUser();
  if (!agency) return NextResponse.json({ error: t("Solo para cuentas de agencia", "Agency accounts only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });

  const creator = await prismaRoot.creator.findUnique({ where: { id: parsed.data.creatorId }, select: { id: true, agencyId: true, name: true } });
  if (!creator || creator.agencyId !== agency.agencyId) {
    return NextResponse.json({ error: t("Esa cuenta no es de tu cartera", "That account is not in your roster") }, { status: 403 });
  }
  const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId: creator.id, role: "owner" }, orderBy: { createdAt: "asc" } });
  if (!owner) return NextResponse.json({ error: t("Esa cuenta no tiene usuario", "That account has no user") }, { status: 404 });

  await logAgencyAction(agency.agencyId, agency.email, "enter_as", creator.id, `Cuenta: ${owner.email}`);
  return withSession(NextResponse.json({ ok: true }), owner, agency.id);
}

/** Salir de "Entrar a esta cuenta" y volver al panel de la agencia. */
export async function DELETE() {
  const { t } = await getT();
  const session = await getSession();
  if (!session?.actorId) return NextResponse.json({ error: t("No estás entrando a otra cuenta", "You're not signed in as another account") }, { status: 400 });
  const actor = await prismaRoot.adminUser.findUnique({ where: { id: session.actorId }, select: { id: true, email: true, creatorId: true, sessionVersion: true, agencyId: true, agencyRole: true } });
  if (!actor?.agencyId || (actor.agencyRole !== "owner" && actor.agencyRole !== "cm")) {
    return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 403 });
  }
  return withSession(NextResponse.json({ ok: true, back: "/admin/agencia" }), actor);
}
