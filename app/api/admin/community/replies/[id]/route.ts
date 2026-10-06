import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { participation } from "@/lib/community-server";
import { replySchema } from "@/lib/community-schemas";
import { REPUTATION, canEditWithin, LIMITS } from "@/lib/community";

export const dynamic = "force-dynamic";

async function ownReply(id: string, creatorId: string) {
  const reply = await prismaRoot.communityReply.findUnique({
    where: { id },
    select: { id: true, creatorId: true, profileId: true, postId: true, createdAt: true, deletedAt: true, hiddenAt: true },
  });
  return reply && reply.creatorId === creatorId && !reply.deletedAt ? reply : null;
}

/** Editar mi respuesta (primeros 30 minutos). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const can = await participation(session, t);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });
  const { id } = await params;
  const reply = await ownReply(id, session.creatorId);
  if (!reply) return NextResponse.json({ error: t("No encontré esa respuesta", "Couldn't find that reply") }, { status: 404 });
  if (!canEditWithin(reply.createdAt)) {
    return NextResponse.json({ error: t(`Solo se puede editar los primeros ${LIMITS.editMinutes} minutos`, `You can only edit in the first ${LIMITS.editMinutes} minutes`) }, { status: 403 });
  }
  const parsed = replySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa tu respuesta", "Check your reply") }, { status: 400 });
  await prismaRoot.communityReply.update({ where: { id }, data: { body: parsed.data.body } });
  return NextResponse.json({ ok: true });
}

/** Borrar mi respuesta. Si era la mejor respuesta, deja de serlo (y se quitan esos puntos). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: t("El equipo no puede borrar en nombre de una cuenta", "The team can't delete on behalf of an account") }, { status: 403 });
  const { id } = await params;
  const reply = await ownReply(id, session.creatorId);
  if (!reply) return NextResponse.json({ error: t("No encontré esa respuesta", "Couldn't find that reply") }, { status: 404 });
  const post = await prismaRoot.communityPost.findUnique({ where: { id: reply.postId }, select: { bestReplyId: true } });
  const wasBest = post?.bestReplyId === reply.id;
  await prismaRoot.$transaction(async (tx) => {
    await tx.communityReply.update({ where: { id }, data: { deletedAt: new Date() } });
    await tx.communityPost.update({
      where: { id: reply.postId },
      data: { replyCount: { decrement: reply.hiddenAt ? 0 : 1 }, ...(wasBest ? { bestReplyId: null } : {}) },
    });
    if (wasBest) {
      const profile = await tx.communityProfile.findUnique({ where: { id: reply.profileId }, select: { reputation: true } });
      if (profile) {
        await tx.communityProfile.update({ where: { id: reply.profileId }, data: { reputation: Math.max(0, profile.reputation - REPUTATION.bestAnswer) } });
      }
    }
  });
  return NextResponse.json({ ok: true });
}
