import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { notifyTeamOfTicket } from "@/lib/support-notify";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

/** Ticket de la cuenta con sesión (el cliente de Prisma filtra por cuenta). */
async function ownTicket(id: string) {
  return prisma.supportTicket.findFirst({ where: { id } });
}

const replySchema = z.object({ message: z.string().trim().min(1).max(5000) });

/** La cuenta responde en su ticket (si estaba cerrado, se reabre). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const { id } = await params;
  const ticket = await ownTicket(id);
  if (!ticket) return NextResponse.json({ error: t("No encontré ese ticket", "Couldn't find that ticket") }, { status: 404 });
  const parsed = replySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe tu mensaje", "Write your message") }, { status: 400 });
  const [user, creator] = await Promise.all([
    prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { email: true, name: true } }),
    prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { name: true } }),
  ]);
  if (!user) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  await prismaRoot.$transaction([
    prismaRoot.supportMessage.create({ data: { ticketId: ticket.id, body: parsed.data.message, authorEmail: user.email, authorName: user.name } }),
    prismaRoot.supportTicket.update({ where: { id: ticket.id }, data: { status: "open", unreadByCustomer: false, lastActivityAt: new Date() } }),
  ]);
  await notifyTeamOfTicket(ticket, "reply", creator?.name ?? user.email, parsed.data.message);
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({ action: z.enum(["close", "reopen"]) });

/** La cuenta cierra (resuelto) o reabre su ticket. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const ticket = await ownTicket(id);
  if (!ticket) return NextResponse.json({ error: t("No encontré ese ticket", "Couldn't find that ticket") }, { status: 404 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  await prismaRoot.supportTicket.update({
    where: { id: ticket.id },
    data: { status: parsed.data.action === "close" ? "closed" : "open", unreadByCustomer: false, lastActivityAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
