import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { withSession } from "@/lib/creators";
import { getSession } from "@/lib/tenant";
import { isPlatformAdminEmail, logPlatformAction, platformAdminUser } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

const schema = z.object({ creatorId: z.string().min(1) });

/** "Entrar como": abre el panel de otra cuenta para darle soporte (queda registrado). */
export async function POST(request: Request) {
  const admin = await platformAdminUser();
  if (!admin) return NextResponse.json({ error: "Solo para quien administra Foliocrew" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  if (parsed.data.creatorId === admin.creatorId) {
    return NextResponse.json({ error: "Esa es tu propia cuenta" }, { status: 400 });
  }
  const owner = await prismaRoot.adminUser.findFirst({
    where: { creatorId: parsed.data.creatorId, role: "owner" },
    orderBy: { createdAt: "asc" },
  });
  if (!owner) return NextResponse.json({ error: "Esa cuenta no tiene usuario" }, { status: 404 });
  await logPlatformAction(admin.email, "impersonate", owner.creatorId, owner.email);
  return withSession(NextResponse.json({ ok: true }), owner, admin.id);
}

/** Salir de "Entrar como" y volver a la cuenta propia. */
export async function DELETE() {
  const session = await getSession();
  if (!session?.actorId) return NextResponse.json({ error: "No estás entrando como otra cuenta" }, { status: 400 });
  const actor = await prismaRoot.adminUser.findUnique({ where: { id: session.actorId } });
  if (!actor || !isPlatformAdminEmail(actor.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return withSession(NextResponse.json({ ok: true }), actor);
}
