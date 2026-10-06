import { prismaRoot } from "./prisma-root";
import { sendEmail } from "./email";
import { noticeEmail } from "./email-templates";
import { mailLangFor } from "./email-lang";
import { platformOrigin } from "./site-url";
import { isUnread, pairOf } from "./community";
import { blockedIds } from "./community-server";
import { connectionBetween } from "./community-connections";

// Mensajes directos de la comunidad: solo entre conexiones aceptadas y sin bloqueos.
// Son privados: el equipo "entrando como" no los puede leer (se valida en cada página y API).

/** ¿Pueden escribirse? (conexión aceptada y ningún bloqueo entre las dos cuentas). */
export async function canMessage(me: string, other: string) {
  if (me === other) return false;
  const [connection, blocked] = await Promise.all([connectionBetween(me, other), blockedIds(me)]);
  return connection?.status === "accepted" && !blocked.includes(other);
}

/** La conversación entre dos cuentas (o null si nunca se escribieron). */
export function conversationWith(me: string, other: string) {
  return prismaRoot.communityConversation.findUnique({ where: { aId_bId: pairOf(me, other) } });
}

/** Marca como leída la conversación para `me`. */
export function markRead(conversation: { id: string; aId: string }, me: string) {
  const now = new Date();
  return prismaRoot.communityConversation.update({
    where: { id: conversation.id },
    data: conversation.aId === me ? { aReadAt: now } : { bReadAt: now },
  });
}

/** Guarda un mensaje (crea la conversación si hace falta) y la deja leída para quien envía. */
export async function sendMessage(me: string, other: string, body: string) {
  const pair = pairOf(me, other);
  const now = new Date();
  const readField = pair.aId === me ? { aReadAt: now } : { bReadAt: now };
  const conversation = await prismaRoot.communityConversation.upsert({
    where: { aId_bId: pair },
    create: { ...pair, lastMessageAt: now, lastSenderId: me, ...readField },
    update: { lastMessageAt: now, lastSenderId: me, ...readField },
  });
  const message = await prismaRoot.communityMessage.create({
    data: { conversationId: conversation.id, senderId: me, body, createdAt: now },
    select: { id: true, body: true, createdAt: true },
  });
  return { conversation, message };
}

/** Conversaciones con mensajes sin leer (para el contador del menú). */
export async function unreadConversationsCount(me: string) {
  const rows = await prismaRoot.communityConversation.findMany({
    where: { OR: [{ aId: me }, { bId: me }], lastSenderId: { not: me } },
    orderBy: { lastMessageAt: "desc" },
    take: 200,
    select: { aId: true, aReadAt: true, bReadAt: true, lastMessageAt: true, lastSenderId: true, bId: true },
  });
  const blocked = rows.length ? await blockedIds(me) : [];
  return rows.filter((c) => isUnread(c, me) && !blocked.includes(c.aId === me ? c.bId : c.aId)).length;
}

/** Correo por mensaje nuevo: máximo 1 por conversación cada hora y respetando "Avisos por correo". */
export async function notifyMessage(p: { toCreatorId: string; fromName: string; fromHandle: string; excerpt: string }) {
  try {
    const { tooManyAttempts } = await import("./rate-limit");
    if (tooManyAttempts(`community-dm-mail:${p.fromHandle}:${p.toCreatorId}`, 1, 60 * 60_000)) return;
    const [profile, owner] = await Promise.all([
      prismaRoot.communityProfile.findUnique({ where: { creatorId: p.toCreatorId }, select: { emailNotify: true } }),
      prismaRoot.adminUser.findFirst({ where: { creatorId: p.toCreatorId, role: "owner" }, orderBy: { createdAt: "asc" }, select: { email: true, name: true } }),
    ]);
    if (!profile?.emailNotify || !owner) return;
    const origin = await platformOrigin();
    const lang = await mailLangFor(owner.email);
    const en = lang === "en";
    const mail = noticeEmail({
      lang,
      origin,
      name: owner.name,
      subject: en ? `New message from ${p.fromName}` : `Mensaje nuevo de ${p.fromName}`,
      title: en ? "You have a new message" : "Tienes un mensaje nuevo",
      lines: [
        en
          ? `${p.fromName} (@${p.fromHandle}) sent you a message in the Foliocrew community.`
          : `${p.fromName} (@${p.fromHandle}) te escribió en la comunidad de Foliocrew.`,
      ],
      quote: p.excerpt.slice(0, 300),
      button: { label: en ? "Reply" : "Responder", url: `${origin}/admin/comunidad/mensajes/${p.fromHandle}` },
      note: en ? "You can turn off these emails in Community → My profile." : "Puedes desactivar estos correos en Comunidad → Mi perfil.",
    });
    await sendEmail({ to: owner.email, ...mail });
  } catch (error) {
    console.error("No se pudo avisar del mensaje", error);
  }
}
