import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { participation } from "@/lib/community-server";
import { REPUTATION, nextReputation } from "@/lib/community";

export const dynamic = "force-dynamic";

const schema = z.object({ replyId: z.string().min(1).max(40).nullable() });

/** Quien preguntó elige (o quita) la mejor respuesta: +10 de reputación a su autor. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const can = await participation(session, t);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { id } = await params;
  const post = await prismaRoot.communityPost.findUnique({ where: { id }, select: { creatorId: true, kind: true, bestReplyId: true, deletedAt: true } });
  if (!post || post.deletedAt || post.creatorId !== session.creatorId) {
    return NextResponse.json({ error: t("Solo quien preguntó puede elegir la mejor respuesta", "Only the person who asked can pick the best answer") }, { status: 403 });
  }
  if (post.kind !== "pregunta") return NextResponse.json({ error: t("Solo las preguntas tienen mejor respuesta", "Only questions have a best answer") }, { status: 400 });

  const { replyId } = parsed.data;
  if (replyId === post.bestReplyId) return NextResponse.json({ ok: true });
  const reply = replyId
    ? await prismaRoot.communityReply.findUnique({ where: { id: replyId }, select: { postId: true, creatorId: true, hiddenAt: true, deletedAt: true } })
    : null;
  if (replyId && (!reply || reply.postId !== id || reply.hiddenAt || reply.deletedAt)) {
    return NextResponse.json({ error: t("No encontré esa respuesta", "Couldn't find that reply") }, { status: 404 });
  }
  if (reply && reply.creatorId === session.creatorId) {
    return NextResponse.json({ error: t("No puedes elegir tu propia respuesta", "You can't pick your own reply") }, { status: 400 });
  }

  await prismaRoot.$transaction(async (tx) => {
    const adjust = async (rid: string, delta: number) => {
      const r = await tx.communityReply.findUnique({ where: { id: rid }, select: { profile: { select: { id: true, reputation: true } } } });
      if (r) await tx.communityProfile.update({ where: { id: r.profile.id }, data: { reputation: nextReputation(r.profile.reputation, delta) } });
    };
    if (post.bestReplyId) await adjust(post.bestReplyId, -REPUTATION.bestAnswer);
    if (replyId) await adjust(replyId, REPUTATION.bestAnswer);
    await tx.communityPost.update({ where: { id }, data: { bestReplyId: replyId } });
  });
  return NextResponse.json({ ok: true });
}
