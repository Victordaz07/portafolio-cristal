import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { participation } from "@/lib/community-server";
import { accountPlan } from "@/lib/circles-server";
import { MAX_MESSAGE, MESSAGES_PER_10_MIN, canAccess } from "@/lib/circles";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ body: z.string().trim().min(1).max(MAX_MESSAGE) });

/** Escribir en un círculo (solo quien es miembro y puede participar en la comunidad). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const can = await participation(session, t);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t(`Escribe entre 1 y ${MAX_MESSAGE} caracteres`, `Write between 1 and ${MAX_MESSAGE} characters`) }, { status: 400 });
  const { slug } = await params;
  const circle = await prismaRoot.circle.findUnique({ where: { slug } });
  if (!circle || circle.archivedAt) return NextResponse.json({ error: t("No se encontró el círculo", "Circle not found") }, { status: 404 });
  const member = await prismaRoot.circleMember.findUnique({ where: { circleId_creatorId: { circleId: circle.id, creatorId: session.creatorId } }, select: { id: true } });
  if (!member) return NextResponse.json({ error: t("Únete al círculo para escribir", "Join the circle to write") }, { status: 403 });
  // Si la cuenta dejó de ser Crew, ya no escribe en círculos exclusivos.
  if (!canAccess(circle.crewOnly, await accountPlan(session.creatorId))) return NextResponse.json({ error: t("Este círculo es para el plan Crew", "This circle is for the Crew plan") }, { status: 403 });
  if (tooManyAttempts(`circle-msg:${session.creatorId}`, MESSAGES_PER_10_MIN, 10 * 60_000)) return NextResponse.json({ error: t("Escribiste varias veces seguidas. Espera un rato.", "You wrote several times in a row. Wait a bit.") }, { status: 429 });
  const message = await prismaRoot.circleMessage.create({ data: { circleId: circle.id, creatorId: session.creatorId, body: parsed.data.body }, select: { id: true } });
  return NextResponse.json({ ok: true, id: message.id }, { status: 201 });
}
