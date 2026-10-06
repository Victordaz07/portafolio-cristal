import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { participation } from "@/lib/community-server";
import { postSchema } from "@/lib/community-schemas";
import { canEditWithin, LIMITS } from "@/lib/community";

export const dynamic = "force-dynamic";

async function ownPost(id: string, creatorId: string) {
  const post = await prismaRoot.communityPost.findUnique({ where: { id }, select: { id: true, creatorId: true, createdAt: true, deletedAt: true } });
  return post && post.creatorId === creatorId && !post.deletedAt ? post : null;
}

/** Editar mi publicación (solo los primeros 30 minutos). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const can = await participation(session, t);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });
  const { id } = await params;
  const post = await ownPost(id, session.creatorId);
  if (!post) return NextResponse.json({ error: t("No encontré esa publicación", "Couldn't find that post") }, { status: 404 });
  if (!canEditWithin(post.createdAt)) {
    return NextResponse.json({ error: t(`Solo se puede editar los primeros ${LIMITS.editMinutes} minutos`, `You can only edit in the first ${LIMITS.editMinutes} minutes`) }, { status: 403 });
  }
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos de la publicación", "Check the post details") }, { status: 400 });
  const { imageUrl, ...data } = parsed.data;
  await prismaRoot.communityPost.update({ where: { id }, data: { ...data, imageUrl: imageUrl || null } });
  return NextResponse.json({ ok: true });
}

/** Borrar mi publicación (borrado suave: el equipo la puede revisar si hubo un reporte). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: t("El equipo no puede borrar en nombre de una cuenta", "The team can't delete on behalf of an account") }, { status: 403 });
  const { id } = await params;
  const post = await ownPost(id, session.creatorId);
  if (!post) return NextResponse.json({ error: t("No encontré esa publicación", "Couldn't find that post") }, { status: 404 });
  await prismaRoot.communityPost.update({ where: { id }, data: { deletedAt: new Date(), pinned: false } });
  return NextResponse.json({ ok: true });
}
