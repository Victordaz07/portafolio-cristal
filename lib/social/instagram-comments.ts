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
type GraphComment = {
  id: string;
  text?: string;
  username?: string;
  timestamp?: string;
  like_count?: number;
  hidden?: boolean;
  replies?: GraphList<{ id: string; text?: string; username?: string; timestamp?: string }>;
};

async function instagramToken() {
  const account = await prisma.socialAccount.findUnique({ where: { platform: "instagram" } });
  if (!account) return null;
  const { tokens } = await getFreshTokens(account);
  return { token: tokens.accessToken, username: (account.username ?? "").replace(/^@/, "").toLowerCase() };
}

export async function isInstagramConnected() {
  return (await prisma.socialAccount.count({ where: { platform: "instagram" } })) > 0;
}

/** Comentarios recientes de las últimas `mediaLimit` publicaciones, del más nuevo al más viejo. */
export async function fetchInstagramComments(mediaLimit = 8): Promise<InboxComment[]> {
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

  const perMedia = await Promise.all(
    withComments.map(async (m) => {
      const list = await fetchJson<GraphList<GraphComment>>(
        `${GRAPH}/${m.id}/comments?${new URLSearchParams({
          fields: "id,text,username,timestamp,like_count,hidden,replies{id,text,username,timestamp}",
          limit: "25",
          access_token: auth.token,
        })}`
      );
      return (list.data ?? [])
        // Sus propios comentarios no son mensajes por responder.
        .filter((c) => (c.username ?? "").toLowerCase() !== auth.username)
        .map<InboxComment>((c) => {
          const replies = (c.replies?.data ?? []).map((r) => ({
            id: r.id,
            text: r.text ?? "",
            username: r.username ?? "",
            timestamp: r.timestamp ?? "",
          }));
          return {
            id: c.id,
            text: c.text ?? "",
            username: c.username ?? "",
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
