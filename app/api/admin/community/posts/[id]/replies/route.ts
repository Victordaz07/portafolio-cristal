import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { participation } from "@/lib/community-server";
import { replySchema } from "@/lib/community-schemas";
import { LIMITS } from "@/lib/community";
import { tooManyAttempts } from "@/lib/rate-limit";
import { notifyCommunity } from "@/lib/community-moderation";

export const dynamic = "force-dynamic";

/** Responder una publicación. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const can = await participation(session, t);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });
  const parsed = replySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: t(`Escribe entre ${LIMITS.reply.min} y ${LIMITS.reply.max} caracteres`, `Write between ${LIMITS.reply.min} and ${LIMITS.reply.max} characters`) }, { status: 400 });
  }
  const { id } = await params;
  const post = await prismaRoot.communityPost.findUnique({
    where: { id },
    select: { id: true, creatorId: true, title: true, hiddenAt: true, deletedAt: true, creator: { select: { status: true } } },
  });
  if (!post || post.hiddenAt || post.deletedAt || post.creator.status !== "active") {
    return NextResponse.json({ error: t("Esa publicación ya no está disponible", "That post is no longer available") }, { status: 404 });
  }
  // Si quien publicó me bloqueó (o yo a esa persona), no se puede responder.
  const block = await prismaRoot.communityBlock.findFirst({
    where: {
      OR: [
        { blockerId: post.creatorId, blockedId: session.creatorId },
        { blockerId: session.creatorId, blockedId: post.creatorId },
      ],
    },
    select: { id: true },
  });
  if (block) return NextResponse.json({ error: t("No puedes responder esta publicación", "You can't reply to this post") }, { status: 403 });
  if (tooManyAttempts(`community-reply:${session.creatorId}`, LIMITS.repliesPerHour, 60 * 60_000)) {
    return NextResponse.json({ error: t("Respondiste muchas veces seguidas. Espera un rato.", "You replied many times in a row. Wait a bit.") }, { status: 429 });
  }

  const now = new Date();
  const [reply] = await prismaRoot.$transaction([
    prismaRoot.communityReply.create({
      data: { postId: post.id, creatorId: session.creatorId, profileId: can.profileId, body: parsed.data.body },
      select: { id: true },
    }),
    prismaRoot.communityPost.update({ where: { id: post.id }, data: { replyCount: { increment: 1 }, lastActivityAt: now } }),
  ]);
  if (post.creatorId !== session.creatorId) {
    const me = await prismaRoot.communityProfile.findUnique({ where: { id: can.profileId }, select: { displayName: true } });
    await notifyCommunity("reply", {
      toCreatorId: post.creatorId,
      postId: post.id,
      postTitle: post.title,
      fromName: me?.displayName ?? "",
      excerpt: parsed.data.body,
    });
  }
  return NextResponse.json({ ok: true, id: reply.id }, { status: 201 });
}
