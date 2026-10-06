import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { isSupportCategory } from "@/lib/support";
import { notifyTeamOfTicket } from "@/lib/support-notify";
import { tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  subject: z.string().trim().min(3).max(140),
  category: z.string().refine(isSupportCategory),
  message: z.string().trim().min(5).max(5000),
});

/** La cuenta abre un ticket de soporte. */
export async function POST(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe un asunto y cuéntanos qué pasa", "Write a subject and tell us what's going on") }, { status: 400 });
  if (tooManyAttempts(`support:${session.creatorId}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: t("Abriste muchos tickets seguidos. Espera un rato o responde en uno existente.", "You opened many tickets in a row. Wait a bit or reply in an existing one.") }, { status: 429 });
  }
  const [user, creator] = await Promise.all([
    prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { email: true, name: true } }),
    prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { name: true } }),
  ]);
  if (!user) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const { subject, category, message } = parsed.data;
  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      category,
      authorEmail: user.email,
      authorName: user.name,
      messages: { create: { body: message, authorEmail: user.email, authorName: user.name } },
    },
  });
  await notifyTeamOfTicket(ticket, "new", creator?.name ?? user.email, message);
  return NextResponse.json({ ok: true, id: ticket.id, number: ticket.number });
}
