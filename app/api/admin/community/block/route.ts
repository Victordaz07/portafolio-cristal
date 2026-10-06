import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({ handle: z.string().trim().min(1).max(80) });

async function targetId(handle: string) {
  const creator = await prismaRoot.creator.findUnique({ where: { slug: handle.toLowerCase() }, select: { id: true } });
  return creator?.id ?? null;
}

/** Bloquear a alguien: dejamos de vernos y no me puede responder. */
export async function POST(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: t("El equipo no bloquea en nombre de una cuenta", "The team doesn't block on behalf of an account") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const blockedId = await targetId(parsed.data.handle);
  if (!blockedId) return NextResponse.json({ error: t("No encontré esa cuenta", "Couldn't find that account") }, { status: 404 });
  if (blockedId === session.creatorId) return NextResponse.json({ error: t("No puedes bloquearte", "You can't block yourself") }, { status: 400 });
  await prismaRoot.communityBlock
    .upsert({
      where: { blockerId_blockedId: { blockerId: session.creatorId, blockedId } },
      create: { blockerId: session.creatorId, blockedId },
      update: {},
    })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}

/** Desbloquear. */
export async function DELETE(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: t("El equipo no desbloquea en nombre de una cuenta", "The team doesn't unblock on behalf of an account") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const blockedId = await targetId(parsed.data.handle);
  if (blockedId) await prismaRoot.communityBlock.deleteMany({ where: { blockerId: session.creatorId, blockedId } });
  return NextResponse.json({ ok: true });
}
