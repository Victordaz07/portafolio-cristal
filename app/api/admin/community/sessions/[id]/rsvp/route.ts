import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { accountPlan } from "@/lib/circles-server";
import { rsvpDecision, sessionPhase } from "@/lib/circles";

export const dynamic = "force-dynamic";

/** Reservar lugar en una sesión (respeta cupo y plan Crew; quien reservó recibe el enlace). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session || session.actorId) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const user = await prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { emailVerifiedAt: true } });
  if (!user?.emailVerifiedAt) return NextResponse.json({ error: t("Confirma tu correo para reservar", "Confirm your email to book"), }, { status: 403 });
  const { id } = await params;
  const s = await prismaRoot.liveSession.findUnique({ where: { id }, include: { _count: { select: { rsvps: true } } } });
  if (!s) return NextResponse.json({ error: t("No se encontró la sesión", "Session not found") }, { status: 404 });
  const already = Boolean(await prismaRoot.sessionRsvp.findUnique({ where: { sessionId_creatorId: { sessionId: id, creatorId: session.creatorId } }, select: { id: true } }));
  const decision = rsvpDecision({ phase: sessionPhase(s), crewOnly: s.crewOnly, account: await accountPlan(session.creatorId), taken: s._count.rsvps, capacity: s.capacity, already });
  const messages = {
    already: [200, "Ya tienes tu lugar", "You already have your spot"],
    full: [409, "La sesión está llena", "The session is full"],
    ended: [400, "Esta sesión ya terminó", "This session has ended"],
    canceled: [400, "Esta sesión se canceló", "This session was canceled"],
    crew: [403, "Esta sesión es para el plan Crew", "This session is for the Crew plan"],
  } as const;
  if (decision !== "ok") {
    const [status, es, en] = messages[decision];
    return NextResponse.json({ ok: decision === "already", error: decision === "already" ? undefined : t(es, en), message: decision === "already" ? t(es, en) : undefined }, { status });
  }
  try {
    await prismaRoot.sessionRsvp.create({ data: { sessionId: id, creatorId: session.creatorId } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
  }
  // Doble comprobación del cupo tras reservar (dos personas a la vez): si nos pasamos, esta reserva se deshace.
  if (s.capacity != null && (await prismaRoot.sessionRsvp.count({ where: { sessionId: id } })) > s.capacity) {
    await prismaRoot.sessionRsvp.deleteMany({ where: { sessionId: id, creatorId: session.creatorId } });
    return NextResponse.json({ error: t("La sesión está llena", "The session is full") }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

/** Cancelar mi lugar. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session || session.actorId) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const { id } = await params;
  await prismaRoot.sessionRsvp.deleteMany({ where: { sessionId: id, creatorId: session.creatorId } });
  return NextResponse.json({ ok: true });
}
