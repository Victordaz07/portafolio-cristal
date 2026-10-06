import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { LIMITS } from "@/lib/community";
import { blockedIds, participation, profileByHandle } from "@/lib/community-server";
import { canMessage, conversationWith, markRead, notifyMessage, sendMessage } from "@/lib/community-messages";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** La otra persona de la conversación (por su @handle), o null si no existe o hay un bloqueo. */
async function other(handle: string, me: string) {
  const found = await profileByHandle(handle);
  if (!found || found.creator.id === me) return null;
  if ((await blockedIds(me)).includes(found.creator.id)) return null;
  return found;
}

/** Mensajes nuevos desde `after` (el chat pregunta cada 10 s). Marca la conversación como leída. */
export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: t("Los mensajes son privados", "Messages are private") }, { status: 403 });
  const { handle } = await params;
  const found = await other(handle, session.creatorId);
  if (!found) return NextResponse.json({ error: t("No encontré esa cuenta", "Couldn't find that account") }, { status: 404 });
  const conversation = await conversationWith(session.creatorId, found.creator.id);
  if (!conversation) return NextResponse.json({ messages: [] });
  const afterParam = new URL(request.url).searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : null;
  const messages = await prismaRoot.communityMessage.findMany({
    where: { conversationId: conversation.id, hiddenAt: null, ...(after && !isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, senderId: true, body: true, createdAt: true },
  });
  if (messages.some((m) => m.senderId !== session.creatorId)) await markRead(conversation, session.creatorId);
  return NextResponse.json({
    messages: messages.map((m) => ({ id: m.id, mine: m.senderId === session.creatorId, body: m.body, createdAt: m.createdAt.toISOString() })),
  });
}

const schema = z.object({ body: z.string().trim().min(1).max(LIMITS.message) });

/** Enviar un mensaje (solo entre conexiones aceptadas). */
export async function POST(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });
  const can = await participation(session, t);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: t(`Escribe un mensaje (hasta ${LIMITS.message} caracteres)`, `Write a message (up to ${LIMITS.message} characters)`) }, { status: 400 });
  }
  const { handle } = await params;
  const found = await other(handle, session.creatorId);
  if (!found) return NextResponse.json({ error: t("No encontré esa cuenta", "Couldn't find that account") }, { status: 404 });
  if (!(await canMessage(session.creatorId, found.creator.id))) {
    return NextResponse.json({ error: t("Solo puedes escribir a tus conexiones", "You can only message your connections") }, { status: 403 });
  }
  if (tooManyAttempts(`community-dm:${session.creatorId}`, LIMITS.messagesPerHour, 60 * 60_000)) {
    return NextResponse.json({ error: t("Enviaste muchos mensajes seguidos. Espera un rato.", "You sent many messages in a row. Wait a bit.") }, { status: 429 });
  }
  const { message } = await sendMessage(session.creatorId, found.creator.id, parsed.data.body);
  const [mine, myCreator] = await Promise.all([
    prismaRoot.communityProfile.findUnique({ where: { creatorId: session.creatorId }, select: { displayName: true } }),
    prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { slug: true } }),
  ]);
  await notifyMessage({ toCreatorId: found.creator.id, fromName: mine?.displayName ?? "", fromHandle: myCreator?.slug ?? "", excerpt: message.body });
  return NextResponse.json({ message: { id: message.id, mine: true, body: message.body, createdAt: message.createdAt.toISOString() } });
}
