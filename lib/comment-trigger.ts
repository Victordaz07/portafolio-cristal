// «Comenta una palabra → DM» (C6). Lógica pura (se prueba en tests/comment-trigger.test.ts).
// Reglas de Meta que se respetan: solo se responde a quien comentó, una vez por comentario y dentro de 7 días,
// y nunca a la propia cuenta.

export const MAX_KEYWORD = 30;
export const MAX_MESSAGE = 900;
export const MAX_TRIGGERS = 20;
/** Tope de DMs automáticos por día y por cuenta (frena abusos y respeta los límites de Meta). */
export const DAILY_DM_CAP = 200;
/** Meta solo permite la respuesta privada durante los 7 días siguientes al comentario. */
export const REPLY_WINDOW_DAYS = 7;
export const DM_SCOPE = "instagram_business_manage_messages";

/** El DM automático solo se activa cuando el dueño confirma que Meta aprobó el permiso. */
export const dmEnabled = () => process.env.INSTAGRAM_DM_ENABLED === "1";

const strip = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** «  ¡LINK! » → «link». Solo letras y números, una sola palabra. */
export function normalizeKeyword(input: string) {
  const word = strip(input).replace(/[^a-z0-9ñ]/g, "");
  return word.slice(0, MAX_KEYWORD);
}

/** ¿El comentario contiene la palabra completa? («link» sí en «Quiero el LINK!!», no en «linkedin»). */
export function matchesKeyword(comment: string, keyword: string) {
  const key = normalizeKeyword(keyword);
  if (!key) return false;
  return strip(comment)
    .split(/[^a-z0-9ñ]+/)
    .includes(key);
}

export interface CommentEvent {
  /** Id de la cuenta de Instagram que recibió el comentario. */
  accountId: string;
  commentId: string;
  mediaId: string;
  text: string;
  fromId: string;
  fromUsername: string | null;
  /** Segundos desde 1970 (la hora de Meta), si viene. */
  time: number | null;
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);
const str = (v: unknown) => (typeof v === "string" && v ? v : null);

/** Saca los comentarios nuevos del aviso (webhook) de Meta. Lo que no tenga forma válida se descarta. */
export function parseCommentEvents(body: unknown): CommentEvent[] {
  const root = obj(body);
  if (!root || root.object !== "instagram" || !Array.isArray(root.entry)) return [];
  const out: CommentEvent[] = [];
  for (const entryRaw of root.entry) {
    const entry = obj(entryRaw);
    const accountId = str(entry?.id);
    if (!entry || !accountId || !Array.isArray(entry.changes)) continue;
    for (const changeRaw of entry.changes) {
      const change = obj(changeRaw);
      if (!change || change.field !== "comments") continue;
      const value = obj(change.value);
      const from = obj(value?.from);
      const media = obj(value?.media);
      const commentId = str(value?.id);
      const text = str(value?.text);
      const mediaId = str(media?.id);
      const fromId = str(from?.id);
      if (!commentId || !text || !mediaId || !fromId) continue;
      const time = typeof entry.time === "number" ? entry.time : null;
      out.push({ accountId, commentId, mediaId, text, fromId, fromUsername: str(from?.username), time });
    }
  }
  return out;
}

/** ¿Sigue dentro de la ventana de 7 días para responder en privado? */
export function withinReplyWindow(time: number | null, now: Date = new Date()) {
  if (time == null) return true;
  return now.getTime() - time * 1000 <= REPLY_WINDOW_DAYS * 86_400_000;
}

/** ¿El comentario lo escribió la propia cuenta (o es una respuesta suya)? No se le manda DM a uno mismo. */
export function isOwnComment(event: Pick<CommentEvent, "fromId">, ownIds: (string | null | undefined)[]) {
  return ownIds.some((id) => id && id === event.fromId);
}

export interface RuleInput {
  keyword: string;
  message: string;
  mediaId: string;
}

/** Valida una regla antes de guardarla. Devuelve el motivo si no es válida. */
export function validateRule(input: RuleInput): { ok: true; keyword: string; message: string } | { ok: false; reason: "keyword" | "message" | "media" } {
  const keyword = normalizeKeyword(input.keyword);
  const message = input.message.trim();
  if (!input.mediaId.trim()) return { ok: false, reason: "media" };
  if (keyword.length < 2) return { ok: false, reason: "keyword" };
  if (!message || message.length > MAX_MESSAGE) return { ok: false, reason: "message" };
  return { ok: true, keyword, message };
}

/** Reemplaza {nombre} por el usuario de quien comentó (o por «hola» si Meta no lo da). */
export function fillMessage(message: string, username: string | null) {
  return message.replace(/\{nombre\}|\{name\}/gi, username ? `@${username}` : "").replace(/\s{2,}/g, " ").trim();
}
