import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { requireRole, teamDisplayName } from "@/lib/team";
import { notifyCustomerOfReply } from "@/lib/support-notify";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const replySchema = z.object({
  message: z.string().trim().min(1).max(5000),
  /** Nota interna: solo la ve el equipo. */
  internal: z.boolean().default(false),
});

/** El equipo responde un ticket o agrega una nota interna. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const user = await requireRole("support");
  if (!user) return NextResponse.json({ error: t("Solo el equipo del Centro de ayuda", "Help center team only") }, { status: 403 });
  const { id } = await params;
  const ticket = await prismaRoot.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: t("No encontré ese ticket", "Couldn't find that ticket") }, { status: 404 });
  const parsed = replySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe la respuesta", "Write the reply") }, { status: 400 });
  const { message, internal } = parsed.data;
  const name = teamDisplayName(user);

  await prismaRoot.$transaction([
    prismaRoot.supportMessage.create({
      data: { ticketId: ticket.id, body: message, internal, fromTeam: true, authorEmail: user.email, authorName: name },
    }),
    prismaRoot.supportTicket.update({
      where: { id: ticket.id },
      data: internal
        ? { assignedTo: ticket.assignedTo ?? user.email }
        : { status: "waiting", unreadByCustomer: true, lastActivityAt: new Date(), assignedTo: ticket.assignedTo ?? user.email },
    }),
  ]);
  if (!internal) await notifyCustomerOfReply(ticket, name, message);
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  status: z.enum(["open", "waiting", "closed"]).optional(),
  /** Correo de quien lo atiende; "" = sin asignar. */
  assignedTo: z.string().trim().toLowerCase().max(200).optional(),
});

/** Cambiar estado o asignación de un ticket. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const user = await requireRole("support");
  if (!user) return NextResponse.json({ error: t("Solo el equipo del Centro de ayuda", "Help center team only") }, { status: 403 });
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { status, assignedTo } = parsed.data;
  const updated = await prismaRoot.supportTicket
    .update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(assignedTo !== undefined ? { assignedTo: assignedTo || null } : {}),
      },
    })
    .catch(() => null);
  if (!updated) return NextResponse.json({ error: t("No encontré ese ticket", "Couldn't find that ticket") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
