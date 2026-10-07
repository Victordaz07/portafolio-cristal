import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { participation } from "@/lib/community-server";
import { accountPlan } from "@/lib/circles-server";
import { MAX_CIRCLES_PER_PERSON, canAccess } from "@/lib/circles";

export const dynamic = "force-dynamic";

/** Unirse a un círculo (los de Crew exigen el plan Crew). */
export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const can = await participation(session, t);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });
  const { slug } = await params;
  const circle = await prismaRoot.circle.findUnique({ where: { slug } });
  if (!circle || circle.archivedAt) return NextResponse.json({ error: t("No se encontró el círculo", "Circle not found") }, { status: 404 });
  if (!canAccess(circle.crewOnly, await accountPlan(session.creatorId))) return NextResponse.json({ error: t("Este círculo es para el plan Crew", "This circle is for the Crew plan") }, { status: 403 });
  if ((await prismaRoot.circleMember.count({ where: { creatorId: session.creatorId } })) >= MAX_CIRCLES_PER_PERSON) return NextResponse.json({ error: t(`Puedes estar en hasta ${MAX_CIRCLES_PER_PERSON} círculos`, `You can be in up to ${MAX_CIRCLES_PER_PERSON} circles`) }, { status: 400 });
  await prismaRoot.circleMember.upsert({ where: { circleId_creatorId: { circleId: circle.id, creatorId: session.creatorId } }, create: { circleId: circle.id, creatorId: session.creatorId }, update: {} });
  return NextResponse.json({ ok: true });
}

/** Salir de un círculo. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session || session.actorId) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const { slug } = await params;
  const circle = await prismaRoot.circle.findUnique({ where: { slug }, select: { id: true } });
  if (circle) await prismaRoot.circleMember.deleteMany({ where: { circleId: circle.id, creatorId: session.creatorId } });
  return NextResponse.json({ ok: true });
}
