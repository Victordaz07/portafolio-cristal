import { prisma } from "@/lib/prisma";
import { getFreshTokens } from "./accounts";
import { fetchJson } from "./http";

// Comentarios de Instagram para la Bandeja (Instagram API con Instagram Login).
// Permiso necesario: instagram_business_manage_comments (ya se pide al conectar).
const GRAPH = `https://graph.instagram.com/${process.env.META_GRAPH_VERSION || "v25.0"}`;

export interface InboxComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  likeCount: number;
  hidden: boolean;
  /** true si la creadora ya respondió (hay una respuesta de su cuenta). */
  replied: boolean;
  replies: { id: string; text: string; username: string; timestamp: string }[];
  media: { id: string; caption: string; permalink: string | null; thumbnailUrl: string | null };
}

type GraphList<T> = { data?: T[] };
type GraphMedia = {
  id: string;
  caption?: string;
  permalink?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  comments_count?: number;
};
type GraphAuthor = { id?: string; username?: string };
type GraphComment = {
  id: string;
  text?: string;
  username?: string;
  /** Con acceso estándar Meta deja `username` vacío para quien no tiene rol en la app, pero sí llena `from`. */
  from?: GraphAuthor;
  timestamp?: string;
  like_count?: number;
  hidden?: boolean;
  replies?: GraphList<{ id: string; text?: string; username?: string; from?: GraphAuthor; timestamp?: string }>;
};

/** Usuario de quien escribió el comentario: `username` o, si Meta lo oculta, `from.username`. */
function author(c: { username?: string; from?: GraphAuthor }) {
  return c.username || c.from?.username || "";
}

async function instagramToken() {
  const account = await prisma.socialAccount.findFirst({ where: { platform: "instagram" } });
  if (!account) return null;
  const { tokens } = await getFreshTokens(account);
  return { token: tokens.accessToken, username: (account.username ?? "").replace(/^@/, "").toLowerCase() };
}

export async function isInstagramConnected() {
  return (await prisma.socialAccount.count({ where: { platform: "instagram" } })) > 0;
}

/** Para diagnosticar una Bandeja vacía: cuántos comentarios dice Instagram que hay y cuántos son propios. */
export interface CommentStats {
  reported: number;
  own: number;
}

/** Comentarios recientes de las últimas `mediaLimit` publicaciones, del más nuevo al más viejo. */
export async function fetchInstagramComments(mediaLimit = 8, stats?: CommentStats): Promise<InboxComment[]> {
  const auth = await instagramToken();
  if (!auth) return [];
  const media = await fetchJson<GraphList<GraphMedia>>(
    `${GRAPH}/me/media?${new URLSearchParams({
      fields: "id,caption,permalink,media_type,media_url,thumbnail_url,comments_count",
      limit: String(mediaLimit),
      access_token: auth.token,
    })}`
  );
  const withComments = (media.data ?? []).filter((m) => (m.comments_count ?? 0) > 0);
  if (stats) stats.reported = withComments.reduce((sum, m) => sum + (m.comments_count ?? 0), 0);

  const perMedia = await Promise.all(
    withComments.map(async (m) => {
      const commentsUrl = (fields: string) =>
        `${GRAPH}/${m.id}/comments?${new URLSearchParams({ fields, limit: "25", access_token: auth.token })}`;
      // Si Meta rechazara `from`, se vuelve a los campos de siempre (sin nombre, pero la Bandeja sigue andando).
      const list = await fetchJson<GraphList<GraphComment>>(
        commentsUrl("id,text,username,from,timestamp,like_count,hidden,replies{id,text,username,from,timestamp}")
      ).catch(() =>
        fetchJson<GraphList<GraphComment>>(commentsUrl("id,text,username,timestamp,like_count,hidden,replies{id,text,username,timestamp}"))
      );
      const all = list.data ?? [];
      const others = all
        // Sus propios comentarios no son mensajes por responder.
        .filter((c) => author(c).toLowerCase() !== auth.username);
      if (stats) stats.own += all.length - others.length;
      return others
        .map<InboxComment>((c) => {
          const replies = (c.replies?.data ?? []).map((r) => ({
            id: r.id,
            text: r.text ?? "",
            username: author(r),
            timestamp: r.timestamp ?? "",
          }));
          return {
            id: c.id,
            text: c.text ?? "",
            username: author(c),
            timestamp: c.timestamp ?? "",
            likeCount: c.like_count ?? 0,
            hidden: !!c.hidden,
            replied: replies.some((r) => r.username.toLowerCase() === auth.username),
            replies,
            media: {
              id: m.id,
              caption: (m.caption ?? "").split("\n")[0].slice(0, 80),
              permalink: m.permalink ?? null,
              thumbnailUrl: m.media_type === "VIDEO" ? m.thumbnail_url ?? null : m.media_url ?? m.thumbnail_url ?? null,
            },
          };
        });
    })
  );
  return perMedia.flat().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

async function requireToken() {
  const auth = await instagramToken();
  if (!auth) throw new Error("Instagram no está conectado");
  return auth.token;
}

export async function replyToInstagramComment(commentId: string, message: string) {
  const token = await requireToken();
  return fetchJson<{ id: string }>(
    `${GRAPH}/${encodeURIComponent(commentId)}/replies?${new URLSearchParams({ message, access_token: token })}`,
    { method: "POST" }
  );
}

export async function hideInstagramComment(commentId: string, hide: boolean) {
  const token = await requireToken();
  return fetchJson(
    `${GRAPH}/${encodeURIComponent(commentId)}?${new URLSearchParams({ hide: String(hide), access_token: token })}`,
    { method: "POST" }
  );
}

export async function deleteInstagramComment(commentId: string) {
  const token = await requireToken();
  return fetchJson(`${GRAPH}/${encodeURIComponent(commentId)}?${new URLSearchParams({ access_token: token })}`, {
    method: "DELETE",
  });
}

/**
 * Diagnóstico de la Bandeja (sin tokens ni llaves): qué responde Meta por cada publicación reciente,
 * tanto por el edge /comments como por el campo anidado `comments`.
 */
export async function diagnoseInstagramComments(mediaLimit = 8) {
  const auth = await instagramToken();
  if (!auth) return { connected: false };
  const safe = async <T>(url: string) => {
    try {
      return { ok: true as const, data: await fetchJson<T>(url) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : String(error) };
    }
  };
  const me = await safe<{ user_id?: string; username?: string; account_type?: string }>(
    `${GRAPH}/me?${new URLSearchParams({ fields: "user_id,username,account_type", access_token: auth.token })}`
  );
  const media = await safe<GraphList<GraphMedia & { timestamp?: string }>>(
    `${GRAPH}/me/media?${new URLSearchParams({ fields: "id,permalink,timestamp,comments_count", limit: String(mediaLimit), access_token: auth.token })}`
  );
  if (!media.ok) return { connected: true, account: me.ok ? me.data : me.error, mediaError: media.error };
  const posts = await Promise.all(
    (media.data.data ?? []).map(async (m) => {
      const edge = await safe<GraphList<{ id: string; username?: string; timestamp?: string }>>(
        `${GRAPH}/${m.id}/comments?${new URLSearchParams({ fields: "id,username,timestamp", limit: "25", access_token: auth.token })}`
      );
      const nested = await safe<{ comments?: GraphList<{ id: string; username?: string }> }>(
        `${GRAPH}/${m.id}?${new URLSearchParams({ fields: "comments_count,comments.limit(25){id,username}", access_token: auth.token })}`
      );
      // Prueba del campo `from` (id y usuario del autor): a veces Meta lo entrega aunque oculte `username`.
      const withFrom = await safe<GraphList<{ id: string; from?: { id?: string; username?: string } }>>(
        `${GRAPH}/${m.id}/comments?${new URLSearchParams({ fields: "id,from", limit: "25", access_token: auth.token })}`
      );
      return {
        permalink: m.permalink ?? null,
        timestamp: m.timestamp ?? null,
        commentsCount: m.comments_count ?? 0,
        edge: edge.ok ? { returned: edge.data.data?.length ?? 0, usernames: (edge.data.data ?? []).map((c) => c.username ?? "(sin usuario)") } : { error: edge.error },
        nested: nested.ok
          ? { returned: nested.data.comments?.data?.length ?? 0, usernames: (nested.data.comments?.data ?? []).map((c) => c.username ?? "(sin usuario)") }
          : { error: nested.error },
        from: withFrom.ok
          ? (withFrom.data.data ?? []).map((c) => (c.from ? `${c.from.username ?? "(sin usuario)"}#${c.from.id ? "id" : "sin-id"}` : "(sin from)"))
          : { error: withFrom.error },
      };
    })
  );
  return { connected: true, account: me.ok ? me.data : { error: me.error }, posts };
}
