import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { participation } from "@/lib/community-server";
import { postSchema } from "@/lib/community-schemas";
import { LIMITS } from "@/lib/community";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Publicar en el muro de la comunidad. */
export async function POST(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const can = await participation(session, t);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const error =
      field === "title"
        ? t(`El título debe tener entre ${LIMITS.title.min} y ${LIMITS.title.max} caracteres`, `The title must be ${LIMITS.title.min} to ${LIMITS.title.max} characters`)
        : field === "body"
          ? t(`Escribe entre ${LIMITS.body.min} y ${LIMITS.body.max} caracteres`, `Write between ${LIMITS.body.min} and ${LIMITS.body.max} characters`)
          : t("Revisa los datos de la publicación", "Check the post details");
    return NextResponse.json({ error }, { status: 400 });
  }
  const data = parsed.data;
  if (data.kind === "colaboracion" && data.creatorTypes.length === 0) {
    return NextResponse.json({ error: t("Elige con qué tipo de creador quieres colaborar", "Choose what kind of creator you want to collab with") }, { status: 400 });
  }

  // Anti-spam: por hora y más estricto el primer día de una cuenta nueva.
  const creator = await prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { createdAt: true } });
  const isNew = creator && Date.now() - creator.createdAt.getTime() < 86_400_000;
  if (isNew) {
    const today = await prismaRoot.communityPost.count({ where: { creatorId: session.creatorId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
    if (today >= LIMITS.postsFirstDay) {
      return NextResponse.json({ error: t("Las cuentas nuevas pueden publicar 2 veces el primer día. ¡Mañana más!", "New accounts can post twice on their first day. More tomorrow!") }, { status: 429 });
    }
  }
  if (tooManyAttempts(`community-post:${session.creatorId}`, LIMITS.postsPerHour, 60 * 60_000)) {
    return NextResponse.json({ error: t("Publicaste varias veces seguidas. Espera un rato.", "You posted several times in a row. Wait a bit.") }, { status: 429 });
  }

  const post = await prismaRoot.communityPost.create({
    data: {
      creatorId: session.creatorId,
      profileId: can.profileId,
      kind: data.kind,
      topic: data.topic,
      title: data.title,
      body: data.body,
      imageUrl: data.imageUrl || null,
      creatorTypes: data.creatorTypes,
    },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: post.id }, { status: 201 });
}
