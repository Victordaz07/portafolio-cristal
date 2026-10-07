import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { icsFor } from "@/lib/circles";

export const dynamic = "force-dynamic";

/** Archivo de calendario de una sesión: solo para quien reservó (lleva el enlace de la videollamada). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const { id } = await params;
  const rsvp = await prismaRoot.sessionRsvp.findUnique({ where: { sessionId_creatorId: { sessionId: id, creatorId: session.creatorId } }, include: { session: true } });
  if (!rsvp || rsvp.session.canceledAt) return NextResponse.json({ error: t("Reserva tu lugar primero", "Book your spot first") }, { status: 403 });
  return new NextResponse(icsFor(rsvp.session), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="sesion-${id.slice(0, 8)}.ics"`, "Cache-Control": "no-store" } });
}
