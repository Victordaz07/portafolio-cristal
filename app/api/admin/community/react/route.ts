import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { participation } from "@/lib/community-server";
import { REPUTATION, nextReputation } from "@/lib/community";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ targetType: z.enum(["post", "reply"]), targetId: z.string().min(1).max(40) });

/** "Me sirvió": lo pone o lo quita. Suma o resta 2 puntos de reputación a quien escribió. */
export async function POST(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const can = await participation(session, t);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  if (tooManyAttempts(`community-react:${session.creatorId}`, 120, 60 * 60_000)) {
    return NextResponse.json({ error: t("Demasiados clics seguidos. Espera un rato.", "Too many clicks in a row. Wait a bit.") }, { status: 429 });
  }
  const { targetType, targetId } = parsed.data;

  const target =
    targetType === "post"
      ? await prismaRoot.communityPost.findUnique({ where: { id: targetId }, select: { creatorId: true, profileId: true, hiddenAt: true, deletedAt: true } })
      : await prismaRoot.communityReply.findUnique({ where: { id: targetId }, select: { creatorId: true, profileId: true, hiddenAt: true, deletedAt: true } });
  if (!target || target.hiddenAt || target.deletedAt) {
    return NextResponse.json({ error: t("Ya no está disponible", "No longer available") }, { status: 404 });
  }
  if (target.creatorId === session.creatorId) {
    return NextResponse.json({ error: t("No puedes marcar lo tuyo", "You can't mark your own content") }, { status: 400 });
  }

  const key = { creatorId: session.creatorId, targetType, targetId };
  try {
    const result = await prismaRoot.$transaction(async (tx) => {
      const existing = await tx.communityReaction.findUnique({ where: { creatorId_targetType_targetId: key }, select: { id: true } });
      const delta = existing ? -1 : 1;
      if (existing) await tx.communityReaction.delete({ where: { id: existing.id } });
      else await tx.communityReaction.create({ data: key });
      const updated =
        targetType === "post"
          ? await tx.communityPost.update({ where: { id: targetId }, data: { helpfulCount: { increment: delta } }, select: { helpfulCount: true } })
          : await tx.communityReply.update({ where: { id: targetId }, data: { helpfulCount: { increment: delta } }, select: { helpfulCount: true } });
      const author = await tx.communityProfile.findUnique({ where: { id: target.profileId }, select: { reputation: true } });
      if (author) {
        await tx.communityProfile.update({
          where: { id: target.profileId },
          data: { reputation: nextReputation(author.reputation, delta * REPUTATION.helpful) },
        });
      }
      return { active: !existing, count: Math.max(0, updated.helpfulCount) };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch {
    // Doble clic muy rápido: el segundo choca con el primero. El estado ya quedó bien.
    return NextResponse.json({ error: t("Intenta de nuevo", "Try again") }, { status: 409 });
  }
}
