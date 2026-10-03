import type { PlatformId, SocialProvider, StoredTokens, TokenSet } from "./types";
import { env, fetchJson, formBody, secondsFromNow } from "./http";

// Versión de la Graph API de Meta usada en las llamadas de Instagram y Facebook.
const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v25.0";
const DAY_MS = 86_400_000;

type Json = Record<string, unknown>;

function str(value: unknown) {
  return value == null ? null : String(value);
}

function num(value: unknown) {
  const n = Number(value);
  return value == null || !Number.isFinite(n) ? null : n;
}

// ─── Instagram (Instagram API con Instagram Login, cuentas Business o Creator) ───

const instagram: SocialProvider = {
  id: "instagram",
  label: "Instagram",
  envKeys: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"],
  // Solo lo que la app usa hoy: Meta rechaza en la revisión los permisos que no se usan.
  scopes: ["instagram_business_basic", "instagram_business_manage_comments"],
  consoleUrl: "https://developers.facebook.com/apps/",
  can: [
    "Leer tu perfil, seguidores y publicaciones con sus likes y comentarios",
    "Leer, responder, ocultar y borrar comentarios",
  ],
  later: [
    "Leer y responder DMs (hasta 24 h después del último mensaje de la persona)",
    "Publicar fotos, carruseles, Reels e Historias (hasta 100 por día)",
    "Métricas avanzadas: alcance, vistas, guardados, compartidos y público por edad, país y género",
    "Ver cuándo otras cuentas te mencionan",
  ],
  cannot: [
    "Usar la música de Instagram (el audio va dentro del video)",
    "Editar el texto o la foto de algo ya publicado",
    "Ver la lista de seguidores o las métricas privadas de otras cuentas",
    "Escribir primero por DM a alguien que nunca te escribió",
    "Usarse con otras cuentas sin la revisión de Meta (en modo desarrollo solo tú y tus testers)",
  ],
  authorizeUrl(redirectUri, state) {
    const params = new URLSearchParams({
      client_id: env("INSTAGRAM_APP_ID"),
      redirect_uri: redirectUri,
      response_type: "code",
      scope: this.scopes.join(","),
      state,
    });
    return `https://www.instagram.com/oauth/authorize?${params}`;
  },
  async exchangeCode(code, redirectUri) {
    const short = await fetchJson<Json>(
      "https://api.instagram.com/oauth/access_token",
      formBody({
        client_id: env("INSTAGRAM_APP_ID"),
        client_secret: env("INSTAGRAM_APP_SECRET"),
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      })
    );
    // La respuesta puede venir plana o envuelta en { data: [ ... ] }.
    const entry = (Array.isArray(short.data) ? short.data[0] : short) as Json;
    const shortToken = String(entry.access_token);
    const long = await fetchJson<Json>(
      `https://graph.instagram.com/access_token?${new URLSearchParams({
        grant_type: "ig_exchange_token",
        client_secret: env("INSTAGRAM_APP_SECRET"),
        access_token: shortToken,
      })}`
    );
    const permissions = entry.permissions;
    return {
      accessToken: String(long.access_token),
      expiresAt: secondsFromNow(long.expires_in),
      scopes: Array.isArray(permissions)
        ? permissions.map(String)
        : String(permissions ?? this.scopes.join(",")).split(","),
    };
  },
  async fetchProfile({ accessToken }) {
    const me = await fetchJson<Json>(
      `https://graph.instagram.com/${META_GRAPH_VERSION}/me?${new URLSearchParams({
        fields: "user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count",
        access_token: accessToken,
      })}`
    );
    return {
      externalId: String(me.user_id ?? me.id),
      username: str(me.username),
      displayName: str(me.name),
      avatarUrl: str(me.profile_picture_url),
      followers: num(me.followers_count),
      // id de la app (lo manda Meta al desconectar o pedir borrar datos).
      scopedId: me.id != null ? String(me.id) : null,
      extra: {
        "Tipo de cuenta": str(me.account_type),
        Siguiendo: num(me.follows_count),
        Publicaciones: num(me.media_count),
      },
    };
  },
  async fetchRecent({ accessToken }, limit = 6) {
    const media = await fetchJson<{ data?: Json[] }>(
      `https://graph.instagram.com/${META_GRAPH_VERSION}/me/media?${new URLSearchParams({
        fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
        limit: String(Math.min(limit, 50)),
        access_token: accessToken,
      })}`
    );
    return (media.data ?? []).map((m) => ({
      id: String(m.id),
      title: str(m.caption),
      url: str(m.permalink),
      thumbnailUrl: str(m.thumbnail_url ?? m.media_url),
      publishedAt: str(m.timestamp),
      metrics: { Likes: num(m.like_count), Comentarios: num(m.comments_count) },
      // Las vistas de Instagram requieren el permiso de métricas (insights), que aún no se pide.
      stats: { views: null, likes: num(m.like_count), comments: num(m.comments_count), shares: null },
    }));
  },
  async refresh({ accessToken, expiresAt, connectedAt }) {
    // Los tokens de larga duración (60 días) se renuevan si vencen en menos de 15 días
    // y tienen al menos 24 h de antigüedad (requisito de Meta).
    if (!expiresAt || expiresAt.getTime() - Date.now() > 15 * DAY_MS) return null;
    if (Date.now() - connectedAt.getTime() < DAY_MS) return null;
    const data = await fetchJson<Json>(
      `https://graph.instagram.com/refresh_access_token?${new URLSearchParams({
        grant_type: "ig_refresh_token",
        access_token: accessToken,
      })}`
    );
    return { accessToken: String(data.access_token), expiresAt: secondsFromNow(data.expires_in), scopes: [] };
  },
};

// ─── Facebook (páginas, vía Facebook Login) ───

const facebook: SocialProvider = {
  id: "facebook",
  label: "Facebook",
  envKeys: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"],
  scopes: ["pages_show_list", "pages_read_engagement"],
  consoleUrl: "https://developers.facebook.com/apps/",
  can: ["Listar tus páginas de Facebook y sus seguidores", "Leer las publicaciones recientes de tu página"],
  later: [
    "Publicar y programar posts, fotos, videos y Reels en la página",
    "Métricas de la página: alcance, interacciones y seguidores",
    "Responder y ocultar comentarios",
    "Responder mensajes de Messenger (hasta 24 h después del último mensaje)",
  ],
  cannot: [
    "Publicar o leer un perfil personal (solo páginas)",
    "Usar la música de Facebook",
    "Escribir primero por Messenger a quien no te escribió",
  ],
  authorizeUrl(redirectUri, state) {
    const params = new URLSearchParams({
      client_id: env("FACEBOOK_APP_ID"),
      redirect_uri: redirectUri,
      state,
      response_type: "code",
    });
    // Las apps de tipo Business usan una "configuración" de Facebook Login for Business.
    if (process.env.FACEBOOK_CONFIG_ID) params.set("config_id", process.env.FACEBOOK_CONFIG_ID);
    else params.set("scope", this.scopes.join(","));
    return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?${params}`;
  },
  async exchangeCode(code, redirectUri) {
    const base = `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`;
    const short = await fetchJson<Json>(
      `${base}?${new URLSearchParams({
        client_id: env("FACEBOOK_APP_ID"),
        client_secret: env("FACEBOOK_APP_SECRET"),
        redirect_uri: redirectUri,
        code,
      })}`
    );
    const long = await fetchJson<Json>(
      `${base}?${new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: env("FACEBOOK_APP_ID"),
        client_secret: env("FACEBOOK_APP_SECRET"),
        fb_exchange_token: String(short.access_token),
      })}`
    );
    return {
      accessToken: String(long.access_token),
      expiresAt: secondsFromNow(long.expires_in),
      scopes: this.scopes,
    };
  },
  async fetchProfile({ accessToken }) {
    const graph = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
    const [me, pages] = await Promise.all([
      fetchJson<Json>(`${graph}/me?${new URLSearchParams({ fields: "id,name,picture{url}", access_token: accessToken })}`),
      fetchJson<{ data?: Json[] }>(
        `${graph}/me/accounts?${new URLSearchParams({ fields: "id,name,followers_count,fan_count", access_token: accessToken })}`
      ),
    ]);
    const page = pages.data?.[0];
    const picture = (me.picture as { data?: { url?: string } } | undefined)?.data?.url;
    return {
      externalId: String(me.id),
      username: page ? str(page.name) : null,
      displayName: str(me.name),
      avatarUrl: picture ?? null,
      followers: page ? num(page.followers_count ?? page.fan_count) : null,
      extra: {
        "Páginas con acceso": pages.data?.length ?? 0,
        "Página principal": page ? str(page.name) : "Ninguna — revisa que elegiste tu página al conectar",
      },
    };
  },
  async fetchRecent({ accessToken }, limit = 6) {
    const graph = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
    const pages = await fetchJson<{ data?: Json[] }>(
      `${graph}/me/accounts?${new URLSearchParams({ fields: "id,access_token", access_token: accessToken })}`
    );
    const page = pages.data?.[0];
    if (!page) return [];
    const posts = await fetchJson<{ data?: Json[] }>(
      `${graph}/${page.id}/posts?${new URLSearchParams({
        fields: "id,message,created_time,permalink_url,full_picture",
        limit: String(Math.min(limit, 50)),
        access_token: String(page.access_token),
      })}`
    );
    return (posts.data ?? []).map((p) => ({
      id: String(p.id),
      title: str(p.message),
      url: str(p.permalink_url),
      thumbnailUrl: str(p.full_picture),
      publishedAt: str(p.created_time),
      metrics: {},
      stats: { views: null, likes: null, comments: null, shares: null },
    }));
  },
};

// ─── TikTok (Login Kit + Display API) ───

const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";

function tiktokTokens(data: Json, fallbackScopes: string[]): TokenSet {
  return {
    accessToken: String(data.access_token),
    refreshToken: str(data.refresh_token),
    expiresAt: secondsFromNow(data.expires_in),
    scopes: data.scope ? String(data.scope).split(",") : fallbackScopes,
  };
}

const tiktok: SocialProvider = {
  id: "tiktok",
  label: "TikTok",
  envKeys: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  scopes: ["user.info.basic", "user.info.profile", "user.info.stats", "video.list"],
  consoleUrl: "https://developers.tiktok.com/apps/",
  can: ["Leer tu perfil, seguidores y likes totales", "Listar tus videos con vistas, likes y comentarios"],
  later: [
    "Publicar videos y fotos (en privado hasta que TikTok apruebe la app)",
    "Mandar un video como borrador a la app de TikTok para agregarle sonido y publicarlo allá",
    "Solo con cuenta Business y aprobación de TikTok for Business: leer y responder comentarios y ver métricas avanzadas",
  ],
  cannot: [
    "Leer ni responder DMs (TikTok no los ofrece a creadores)",
    "Responder comentarios con cuenta Creator (solo con cuenta Business)",
    "Usar la música de TikTok desde la API",
    "Publicar más de ~15 veces al día",
    "Usarse con otras cuentas mientras la app esté en Sandbox (solo cuentas de prueba)",
  ],
  authorizeUrl(redirectUri, state) {
    const params = new URLSearchParams({
      client_key: env("TIKTOK_CLIENT_KEY"),
      scope: this.scopes.join(","),
      response_type: "code",
      redirect_uri: redirectUri,
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  },
  async exchangeCode(code, redirectUri) {
    const data = await fetchJson<Json>(
      TIKTOK_TOKEN_URL,
      formBody({
        client_key: env("TIKTOK_CLIENT_KEY"),
        client_secret: env("TIKTOK_CLIENT_SECRET"),
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      })
    );
    return tiktokTokens(data, this.scopes);
  },
  async fetchProfile({ accessToken }) {
    const data = await fetchJson<{ data?: { user?: Json } }>(
      `https://open.tiktokapis.com/v2/user/info/?fields=${[
        "open_id",
        "display_name",
        "avatar_url",
        "username",
        "follower_count",
        "following_count",
        "likes_count",
        "video_count",
      ].join(",")}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const user = data.data?.user ?? {};
    return {
      externalId: String(user.open_id),
      username: str(user.username),
      displayName: str(user.display_name),
      avatarUrl: str(user.avatar_url),
      followers: num(user.follower_count),
      extra: { Siguiendo: num(user.following_count), "Likes totales": num(user.likes_count), Videos: num(user.video_count) },
    };
  },
  async fetchRecent({ accessToken }, limit = 6) {
    const data = await fetchJson<{ data?: { videos?: Json[] } }>(
      `https://open.tiktokapis.com/v2/video/list/?fields=${[
        "id",
        "title",
        "video_description",
        "cover_image_url",
        "share_url",
        "create_time",
        "view_count",
        "like_count",
        "comment_count",
        "share_count",
      ].join(",")}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ max_count: Math.min(limit, 20) }), // TikTok permite hasta 20 por página
      }
    );
    return (data.data?.videos ?? []).map((v) => ({
      id: String(v.id),
      title: str(v.title || v.video_description),
      url: str(v.share_url),
      thumbnailUrl: str(v.cover_image_url),
      publishedAt: v.create_time ? new Date(Number(v.create_time) * 1000).toISOString() : null,
      metrics: { Vistas: num(v.view_count), Likes: num(v.like_count), Comentarios: num(v.comment_count) },
      stats: { views: num(v.view_count), likes: num(v.like_count), comments: num(v.comment_count), shares: num(v.share_count) },
    }));
  },
  async refresh({ refreshToken, expiresAt }) {
    // El access token dura 24 h; se renueva con el refresh token (365 días).
    if (!refreshToken || (expiresAt && expiresAt.getTime() - Date.now() > 5 * 60_000)) return null;
    const data = await fetchJson<Json>(
      TIKTOK_TOKEN_URL,
      formBody({
        client_key: env("TIKTOK_CLIENT_KEY"),
        client_secret: env("TIKTOK_CLIENT_SECRET"),
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      })
    );
    return tiktokTokens(data, this.scopes);
  },
};

// ─── YouTube (Google OAuth + YouTube Data API v3) ───

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const youtube: SocialProvider = {
  id: "youtube",
  label: "YouTube",
  envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
  consoleUrl: "https://console.cloud.google.com/apis/credentials",
  can: ["Leer tu canal, suscriptores y total de vistas", "Listar tus videos recientes con vistas, likes y comentarios"],
  later: [
    "Subir y programar videos y Shorts (en privado hasta que Google apruebe la app)",
    "Editar título, descripción, miniatura y listas de reproducción",
    "Responder y moderar comentarios",
    "Estadísticas avanzadas: tiempo de visualización, retención, público y ganancias",
  ],
  cannot: [
    "Publicaciones de comunidad ni DMs (YouTube no tiene)",
    "Usar la música de YouTube",
    "Mantener la conexión más de 7 días mientras la app de Google esté en modo \"Testing\"",
  ],
  authorizeUrl(redirectUri, state) {
    const params = new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID"),
      redirect_uri: redirectUri,
      response_type: "code",
      scope: this.scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },
  async exchangeCode(code, redirectUri) {
    const data = await fetchJson<Json>(
      GOOGLE_TOKEN_URL,
      formBody({
        code,
        client_id: env("GOOGLE_CLIENT_ID"),
        client_secret: env("GOOGLE_CLIENT_SECRET"),
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      })
    );
    return {
      accessToken: String(data.access_token),
      refreshToken: str(data.refresh_token),
      expiresAt: secondsFromNow(data.expires_in),
      scopes: String(data.scope ?? "").split(" ").filter(Boolean),
    };
  },
  async fetchProfile({ accessToken }) {
    const data = await fetchJson<{ items?: Json[] }>(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const channel = data.items?.[0];
    if (!channel) throw new Error("Esta cuenta de Google no tiene un canal de YouTube");
    const snippet = (channel.snippet ?? {}) as Json;
    const stats = (channel.statistics ?? {}) as Json;
    const thumbs = (snippet.thumbnails ?? {}) as Record<string, { url?: string }>;
    return {
      externalId: String(channel.id),
      username: str(snippet.customUrl),
      displayName: str(snippet.title),
      avatarUrl: thumbs.default?.url ?? null,
      followers: stats.hiddenSubscriberCount ? null : num(stats.subscriberCount),
      extra: { "Vistas totales": num(stats.viewCount), Videos: num(stats.videoCount) },
    };
  },
  async fetchRecent({ accessToken }, limit = 6) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const channels = await fetchJson<{ items?: Json[] }>(
      "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true",
      { headers }
    );
    const details = (channels.items?.[0]?.contentDetails ?? {}) as { relatedPlaylists?: { uploads?: string } };
    const uploads = details.relatedPlaylists?.uploads;
    if (!uploads) return [];
    const playlist = await fetchJson<{ items?: Json[] }>(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=${Math.min(limit, 50)}&playlistId=${uploads}`,
      { headers }
    );
    const ids = (playlist.items ?? []).map((i) => (i.contentDetails as Json).videoId).filter(Boolean);
    if (ids.length === 0) return [];
    const videos = await fetchJson<{ items?: Json[] }>(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${ids.join(",")}`,
      { headers }
    );
    return (videos.items ?? []).map((v) => {
      const snippet = (v.snippet ?? {}) as Json;
      const stats = (v.statistics ?? {}) as Json;
      const thumbs = (snippet.thumbnails ?? {}) as Record<string, { url?: string }>;
      return {
        id: String(v.id),
        title: str(snippet.title),
        url: `https://www.youtube.com/watch?v=${v.id}`,
        thumbnailUrl: thumbs.medium?.url ?? thumbs.default?.url ?? null,
        publishedAt: str(snippet.publishedAt),
        metrics: { Vistas: num(stats.viewCount), Likes: num(stats.likeCount), Comentarios: num(stats.commentCount) },
        stats: { views: num(stats.viewCount), likes: num(stats.likeCount), comments: num(stats.commentCount), shares: null },
      };
    });
  },
  async refresh({ refreshToken, expiresAt }) {
    if (!refreshToken || (expiresAt && expiresAt.getTime() - Date.now() > 5 * 60_000)) return null;
    const data = await fetchJson<Json>(
      GOOGLE_TOKEN_URL,
      formBody({
        client_id: env("GOOGLE_CLIENT_ID"),
        client_secret: env("GOOGLE_CLIENT_SECRET"),
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      })
    );
    return {
      accessToken: String(data.access_token),
      refreshToken, // Google no devuelve uno nuevo al renovar
      expiresAt: secondsFromNow(data.expires_in),
      scopes: [],
    };
  },
};

export const PROVIDERS: Record<PlatformId, SocialProvider> = { instagram, facebook, tiktok, youtube };

export function isProviderConfigured(provider: SocialProvider) {
  return provider.envKeys.every((key) => !!process.env[key]);
}

export type { StoredTokens };
