import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { participation } from "@/lib/community-server";
import { notifyConnection } from "@/lib/community-connections";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["accept", "decline"]) });

/** Aceptar o rechazar una solicitud que me llegó (rechazar es silencioso). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: t("El equipo no responde en nombre de una cuenta", "The team doesn't respond on behalf of an account") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { id } = await params;
  const row = await prismaRoot.communityConnection.findUnique({ where: { id } });
  if (!row || row.addresseeId !== session.creatorId || row.status !== "pending") {
    return NextResponse.json({ error: t("Esta solicitud ya no está disponible", "This request is no longer available") }, { status: 404 });
  }
  if (parsed.data.action === "decline") {
    await prismaRoot.communityConnection.update({ where: { id }, data: { status: "declined", respondedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }
  const can = await participation(session, t);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });
  await prismaRoot.communityConnection.update({ where: { id }, data: { status: "accepted", respondedAt: new Date() } });
  const [mine, myCreator] = await Promise.all([
    prismaRoot.communityProfile.findUnique({ where: { creatorId: session.creatorId }, select: { displayName: true } }),
    prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { slug: true } }),
  ]);
  await notifyConnection("accepted", { toCreatorId: row.requesterId, fromName: mine?.displayName ?? "", fromHandle: myCreator?.slug ?? "" });
  return NextResponse.json({ ok: true });
}

/** Cancelar una solicitud que envié, o quitar una conexión (cualquiera de las dos personas). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: t("El equipo no cambia conexiones de una cuenta", "The team doesn't change an account's connections") }, { status: 403 });
  const { id } = await params;
  const row = await prismaRoot.communityConnection.findUnique({ where: { id } });
  const me = session.creatorId;
  const allowed = row && (row.requesterId === me || (row.status === "accepted" && row.addresseeId === me));
  if (!allowed) return NextResponse.json({ error: t("Esta conexión ya no está disponible", "This connection is no longer available") }, { status: 404 });
  await prismaRoot.communityConnection.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
