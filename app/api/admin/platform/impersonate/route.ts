import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { withSession } from "@/lib/creators";
import { getSession } from "@/lib/tenant";
import { logPlatformAction } from "@/lib/platform-admin";
import { hasRole, teamRolesFor, teamUser } from "@/lib/team";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  creatorId: z.string().min(1),
  /** Motivo (p. ej. "Ticket #12"). Obligatorio para Soporte; la cuenta lo ve en Mi cuenta. */
  reason: z.string().trim().max(300).optional(),
});

/** "Entrar como": abre el panel de otra cuenta para darle soporte (queda registrado). */
export async function POST(request: Request) {
  const { t } = await getT();
  const user = await teamUser();
  if (!hasRole(user, "support")) return NextResponse.json({ error: t("Solo para Soporte o Dueño de Foliocrew", "Support or Foliocrew Owner only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const reason = parsed.data.reason ?? "";
  if (!user.owner && reason.length < 5) {
    return NextResponse.json({ error: t("Escribe el motivo (por ejemplo: «Ticket #12: no puede conectar Instagram»)", "Write the reason (for example: “Ticket #12: can't connect Instagram”)") }, { status: 400 });
  }
  if (parsed.data.creatorId === user.creatorId) {
    return NextResponse.json({ error: t("Esa es tu propia cuenta", "That's your own account") }, { status: 400 });
  }
  const owner = await prismaRoot.adminUser.findFirst({
    where: { creatorId: parsed.data.creatorId, role: "owner" },
    orderBy: { createdAt: "asc" },
  });
  if (!owner) return NextResponse.json({ error: t("Esa cuenta no tiene usuario", "That account has no user") }, { status: 404 });
  await logPlatformAction(user.email, "impersonate", owner.creatorId, reason ? `Motivo: ${reason}` : `Cuenta: ${owner.email}`);
  return withSession(NextResponse.json({ ok: true }), owner, user.id);
}

/** Salir de "Entrar como" y volver a la cuenta propia. */
export async function DELETE() {
  const { t } = await getT();
  const session = await getSession();
  if (!session?.actorId) return NextResponse.json({ error: t("No estás entrando como otra cuenta", "You're not signed in as another account") }, { status: 400 });
  const actor = await prismaRoot.adminUser.findUnique({ where: { id: session.actorId } });
  const access = actor ? await teamRolesFor(actor.email) : null;
  if (!actor || !access || !(access.owner || access.roles.includes("support"))) {
    return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 403 });
  }
  return withSession(NextResponse.json({ ok: true, back: access.owner ? "/admin/plataforma" : "/admin/equipo/soporte" }), actor);
}
