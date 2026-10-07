import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { prismaRoot } from "@/lib/prisma-root";
import { currentCreatorId, runAsCreator } from "@/lib/tenant";
import { sendPush } from "@/lib/push-server";
import { getFreshTokens } from "@/lib/social/accounts";
import { fetchJson } from "@/lib/social/http";
import { DAILY_DM_CAP, DM_SCOPE, dmEnabled, fillMessage, isOwnComment, matchesKeyword, withinReplyWindow, type CommentEvent } from "@/lib/comment-trigger";

// INSTAGRAM_GRAPH_URL solo se usa en las pruebas locales (servidor falso); en producción queda vacío.
const GRAPH = process.env.INSTAGRAM_GRAPH_URL || `https://graph.instagram.com/${process.env.META_GRAPH_VERSION || "v25.0"}`;

/** Procesa los comentarios nuevos que avisó Meta. Nunca lanza: un error en una cuenta no frena a las demás. */
export async function handleCommentEvents(events: CommentEvent[]) {
  for (const event of events) {
    try {
      const account = await prismaRoot.socialAccount.findFirst({
        where: { platform: "instagram", OR: [{ externalId: event.accountId }, { scopedId: event.accountId }] },
        select: { creatorId: true, externalId: true, scopedId: true, scopes: true, creator: { select: { status: true } } },
      });
      if (!account || account.creator.status === "paused") continue;
      await runAsCreator(account.creatorId, () => processEvent(event, account));
    } catch (error) {
      console.error("Comentario → DM: no se pudo procesar un comentario", error instanceof Error ? error.message : error);
    }
  }
}

async function processEvent(event: CommentEvent, account: { externalId: string; scopedId: string | null; scopes: string[] }) {
  if (isOwnComment(event, [account.externalId, account.scopedId])) return;
  // Aviso en el celular (E5) de cualquier comentario nuevo de otra persona (haya regla o no).
  const creatorId = await currentCreatorId();
  await sendPush(
    creatorId,
    "comment",
    (l) => ({
      title: l === "en" ? "New comment on Instagram" : "Nuevo comentario en Instagram",
      body: `${event.fromUsername ? `@${event.fromUsername}: ` : ""}${event.text}`,
      url: "/admin/mensajes",
      tag: `comment-${event.mediaId}`,
    }),
    { key: event.commentId }
  );
  if (!withinReplyWindow(event.time)) return;
  const triggers = await prisma.commentTrigger.findMany({ where: { mediaId: event.mediaId, active: true }, orderBy: { createdAt: "asc" } });
  const trigger = triggers.find((t) => matchesKeyword(event.text, t.keyword));
  if (!trigger) return;

  // Una vez por persona y por regla (y una por comentario): si ya existe, no se repite.
  let hitId: string;
  try {
    const hit = await prisma.commentTriggerHit.create({ data: { triggerId: trigger.id, commenterId: event.fromId, commentId: event.commentId, status: "skipped" } });
    hitId = hit.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  }

  const fail = (status: "failed" | "skipped", reason: string) => prisma.commentTriggerHit.update({ where: { id: hitId }, data: { status, error: reason.slice(0, 300) } });

  if (!dmEnabled() || !account.scopes.includes(DM_SCOPE)) return void (await fail("skipped", "El permiso de mensajes de Instagram aún no está activo"));
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const today = await prisma.commentTriggerHit.count({ where: { status: "sent", createdAt: { gte: startOfDay } } });
  if (today >= DAILY_DM_CAP) return void (await fail("skipped", "Se llegó al tope diario de mensajes automáticos"));

  try {
    const full = await prisma.socialAccount.findFirst({ where: { platform: "instagram" } });
    if (!full) return void (await fail("failed", "La cuenta de Instagram ya no está conectada"));
    const { tokens } = await getFreshTokens(full);
    await fetchJson(`${GRAPH}/${full.externalId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.accessToken}`, "Content-Type": "application/json" },
      // Respuesta privada: se contesta al comentario (recipient.comment_id), así que solo le llega a quien comentó.
      body: JSON.stringify({ recipient: { comment_id: event.commentId }, message: { text: fillMessage(trigger.message, event.fromUsername) } }),
    });
    await prisma.commentTriggerHit.update({ where: { id: hitId }, data: { status: "sent", error: null } });
  } catch (error) {
    await fail("failed", error instanceof Error ? error.message : "Error desconocido");
  }
}
