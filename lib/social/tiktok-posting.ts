import { fetchJson } from "./http";

// TikTok Content Posting API (borrador a la bandeja y publicación directa).
// Referencia: developers.tiktok.com/doc/content-posting-api-reference-direct-post,
// …-upload-video, …-query-creator-info, …-get-video-status y …-media-transfer-guide.
//
// Apagada por defecto. Cada permiso se pide al conectar SOLO si su variable está en "1":
//   TIKTOK_POSTING_DRAFT_ENABLED=1  → video.upload  (mandar el video como borrador a la app de TikTok)
//   TIKTOK_POSTING_DIRECT_ENABLED=1 → video.publish (publicar directo)
// Pedir un permiso que TikTok no aprobó rompe el login de todas las cuentas, así que solo se activan
// cuando el dueño confirma la aprobación. Hasta pasar la auditoría (TIKTOK_POSTING_AUDITED=1),
// la publicación directa solo puede ser privada (SELF_ONLY).

/** Los 4 permisos aprobados hoy (Login Kit + Display API). */
export const TIKTOK_BASE_SCOPES = ["user.info.basic", "user.info.profile", "user.info.stats", "video.list"] as const;
export const TIKTOK_DRAFT_SCOPE = "video.upload";
export const TIKTOK_DIRECT_SCOPE = "video.publish";

type Env = Record<string, string | undefined>;

export function tiktokPostingFlags(env: Env = process.env) {
  return {
    draft: env.TIKTOK_POSTING_DRAFT_ENABLED === "1",
    direct: env.TIKTOK_POSTING_DIRECT_ENABLED === "1",
    audited: env.TIKTOK_POSTING_AUDITED === "1",
  };
}

/** Permisos que se piden al conectar TikTok, según las variables activas. */
export function tiktokScopes(env: Env = process.env): string[] {
  const flags = tiktokPostingFlags(env);
  // TIKTOK_VIDEO_LIST_DISABLED=1 solo para el Sandbox de la demo, donde TikTok no deja agregar video.list:
  // pedir un permiso que la app no tiene hace fallar el login. En producción queda vacía.
  const base = env.TIKTOK_VIDEO_LIST_DISABLED === "1" ? TIKTOK_BASE_SCOPES.filter((s) => s !== "video.list") : [...TIKTOK_BASE_SCOPES];
  return [...base, ...(flags.draft ? [TIKTOK_DRAFT_SCOPE] : []), ...(flags.direct ? [TIKTOK_DIRECT_SCOPE] : [])];
}

export const tiktokPostingEnabled = (env: Env = process.env) => {
  const flags = tiktokPostingFlags(env);
  return flags.draft || flags.direct;
};

// ─── Información del creador (obligatoria antes de cada publicación directa) ───

export const PRIVACY_LEVELS = ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY"] as const;
export type PrivacyLevel = (typeof PRIVACY_LEVELS)[number];
const isPrivacyLevel = (v: unknown): v is PrivacyLevel => (PRIVACY_LEVELS as readonly unknown[]).includes(v);

export interface CreatorInfo {
  avatarUrl: string | null;
  username: string | null;
  nickname: string | null;
  privacyLevelOptions: PrivacyLevel[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec: number | null;
}

const API = "https://open.tiktokapis.com/v2";
const jsonHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" });
type Json = Record<string, unknown>;

export function parseCreatorInfo(data: Json): CreatorInfo {
  const max = Number(data.max_video_post_duration_sec);
  return {
    avatarUrl: data.creator_avatar_url ? String(data.creator_avatar_url) : null,
    username: data.creator_username ? String(data.creator_username) : null,
    nickname: data.creator_nickname ? String(data.creator_nickname) : null,
    privacyLevelOptions: Array.isArray(data.privacy_level_options) ? data.privacy_level_options.filter(isPrivacyLevel) : [],
    commentDisabled: data.comment_disabled === true,
    duetDisabled: data.duet_disabled === true,
    stitchDisabled: data.stitch_disabled === true,
    maxVideoPostDurationSec: Number.isFinite(max) && max > 0 ? max : null,
  };
}

/** POST /v2/post/publish/creator_info/query/ (permiso video.publish). */
export async function queryCreatorInfo(accessToken: string): Promise<CreatorInfo> {
  const res = await fetchJson<{ data?: Json }>(`${API}/post/publish/creator_info/query/`, { method: "POST", headers: jsonHeaders(accessToken) });
  return parseCreatorInfo(res.data ?? {});
}

/** Opciones de privacidad que se pueden ofrecer: sin auditoría, solo «Solo yo». */
export function allowedPrivacyOptions(creator: Pick<CreatorInfo, "privacyLevelOptions">, audited: boolean): PrivacyLevel[] {
  return audited ? creator.privacyLevelOptions : creator.privacyLevelOptions.filter((o) => o === "SELF_ONLY");
}

// ─── Subida del archivo por partes (FILE_UPLOAD) ───

// TikTok mide en MB decimales (su ejemplo usa partes de 10.000.000 bytes): se usan valores redondos
// para no quedar justo en un límite.
const MB = 1_000_000;
/** Hasta 64 MB el archivo va entero en una sola parte (chunk_size = tamaño del video). */
export const SINGLE_CHUNK_MAX_BYTES = 64 * MB;
/** Más grande: partes de 10 MB (TikTok pide entre 5 y 64 MB por parte). */
export const DEFAULT_CHUNK_BYTES = 10 * MB;
export const MAX_VIDEO_BYTES_TIKTOK = 4_000 * MB;

export interface ChunkPlan {
  chunkSize: number;
  totalChunkCount: number;
  ranges: { start: number; end: number }[];
}

/**
 * Partes según la guía de TikTok: hasta 64 MB, una sola parte del tamaño del archivo. Si es más grande,
 * total = tamaño / parte (redondeado hacia abajo) y la última parte absorbe el sobrante (puede medir
 * hasta 128 MB). Con partes de 10 MB la última nunca pasa de 20 MB.
 */
export function planChunks(videoSize: number, chunkSize = DEFAULT_CHUNK_BYTES): ChunkPlan {
  if (!Number.isInteger(videoSize) || videoSize <= 0) throw new TikTokPostingError("video_size");
  if (videoSize > MAX_VIDEO_BYTES_TIKTOK) throw new TikTokPostingError("video_size");
  if (videoSize <= SINGLE_CHUNK_MAX_BYTES) return { chunkSize: videoSize, totalChunkCount: 1, ranges: [{ start: 0, end: videoSize - 1 }] };
  const totalChunkCount = Math.floor(videoSize / chunkSize);
  const ranges = Array.from({ length: totalChunkCount }, (_, i) => ({
    start: i * chunkSize,
    end: i === totalChunkCount - 1 ? videoSize - 1 : (i + 1) * chunkSize - 1,
  }));
  return { chunkSize, totalChunkCount, ranges };
}

function sourceInfo(videoSize: number) {
  const plan = planChunks(videoSize);
  return { source: "FILE_UPLOAD", video_size: videoSize, chunk_size: plan.chunkSize, total_chunk_count: plan.totalChunkCount };
}

// ─── Validación y cuerpos de los pedidos ───

export type TikTokPostingReason =
  | "disabled"
  | "video_size"
  | "video_type"
  | "title"
  | "privacy"
  | "branded_private"
  | "commercial_choice"
  | "duration";

export class TikTokPostingError extends Error {
  constructor(public reason: TikTokPostingReason, message?: string) {
    super(message ?? POSTING_REASON_TEXT[reason][0]);
  }
}

export const POSTING_REASON_TEXT: Record<TikTokPostingReason, [string, string]> = {
  disabled: ["La publicación en TikTok no está activada", "Posting to TikTok isn't enabled"],
  video_size: ["El video está vacío o pesa más de lo que TikTok acepta", "The video is empty or larger than TikTok accepts"],
  video_type: ["TikTok solo acepta videos MP4, MOV o WebM", "TikTok only accepts MP4, MOV or WebM videos"],
  title: ["El texto pasa de 2200 caracteres", "The caption is longer than 2,200 characters"],
  privacy: ["Elige quién puede ver el video", "Choose who can see the video"],
  branded_private: ["El contenido de marca (colaboración pagada) no puede ser privado", "Branded content (paid partnership) can't be private"],
  commercial_choice: ["Indica si el video promociona tu marca, a un tercero o ambos", "Say whether the video promotes your brand, a third party, or both"],
  duration: ["El video dura más de lo que tu cuenta de TikTok permite publicar", "The video is longer than your TikTok account allows"],
};

export const TIKTOK_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
export const isTikTokVideoType = (type: string | null | undefined) => (TIKTOK_VIDEO_TYPES as readonly string[]).includes((type ?? "").split(";")[0].trim().toLowerCase());

export const TITLE_MAX = 2200;

export interface DirectPostInput {
  title: string;
  privacyLevel: string;
  allowComment: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  /** «Divulgar contenido comercial» activado. */
  commercial: boolean;
  /** Promociona el negocio propio → «Promotional content». */
  yourBrand: boolean;
  /** Promociona a un tercero → «Paid partnership». */
  brandedContent: boolean;
  videoSize: number;
  durationSec?: number | null;
}

/** Cuerpo de POST /v2/post/publish/video/init/. Lanza TikTokPostingError si algo no cumple las reglas. */
export function buildDirectPostBody(input: DirectPostInput, creator: CreatorInfo, opts: { audited: boolean }) {
  if (input.title.length > TITLE_MAX) throw new TikTokPostingError("title");
  const privacy = input.privacyLevel;
  if (!isPrivacyLevel(privacy) || !allowedPrivacyOptions(creator, opts.audited).includes(privacy)) throw new TikTokPostingError("privacy");
  if (input.commercial && !input.yourBrand && !input.brandedContent) throw new TikTokPostingError("commercial_choice");
  const branded = input.commercial && input.brandedContent;
  if (branded && privacy === "SELF_ONLY") throw new TikTokPostingError("branded_private");
  if (input.durationSec != null && creator.maxVideoPostDurationSec != null && input.durationSec > creator.maxVideoPostDurationSec) {
    throw new TikTokPostingError("duration");
  }
  return {
    post_info: {
      title: input.title,
      privacy_level: privacy,
      // Lo que el creador tiene apagado en su app queda apagado aunque se pida.
      disable_comment: !input.allowComment || creator.commentDisabled,
      disable_duet: !input.allowDuet || creator.duetDisabled,
      disable_stitch: !input.allowStitch || creator.stitchDisabled,
      brand_content_toggle: branded,
      brand_organic_toggle: input.commercial && input.yourBrand,
    },
    source_info: sourceInfo(input.videoSize),
  };
}

/** Cuerpo de POST /v2/post/publish/inbox/video/init/ (borrador: solo el archivo). */
export function buildDraftBody(videoSize: number) {
  return { source_info: sourceInfo(videoSize) };
}

// ─── Llamadas ───

export interface InitResult {
  publishId: string;
  uploadUrl: string;
}

async function init(path: string, accessToken: string, body: object): Promise<InitResult> {
  const res = await fetchJson<{ data?: Json }>(`${API}${path}`, { method: "POST", headers: jsonHeaders(accessToken), body: JSON.stringify(body) });
  const publishId = res.data?.publish_id;
  const uploadUrl = res.data?.upload_url;
  if (!publishId || !uploadUrl) throw new Error("TikTok no devolvió el enlace de subida");
  return { publishId: String(publishId), uploadUrl: String(uploadUrl) };
}

/** Publicación directa (permiso video.publish). */
export const initDirectPost = (accessToken: string, body: ReturnType<typeof buildDirectPostBody>) =>
  init("/post/publish/video/init/", accessToken, body);

/** Borrador a la bandeja de la app de TikTok (permiso video.upload). */
export const initDraftUpload = (accessToken: string, videoSize: number) =>
  init("/post/publish/inbox/video/init/", accessToken, buildDraftBody(videoSize));

/**
 * Sube el archivo por partes, en orden, al upload_url (vale 1 hora). TikTok responde 206 mientras
 * espera más partes y 201 al recibir la última.
 */
export async function uploadVideoChunks(
  uploadUrl: string,
  videoSize: number,
  contentType: string,
  readRange: (start: number, end: number) => Promise<Uint8Array>
) {
  const plan = planChunks(videoSize);
  for (let i = 0; i < plan.ranges.length; i++) {
    const { start, end } = plan.ranges[i];
    const chunk = await readRange(start, end);
    if (chunk.byteLength !== end - start + 1) throw new Error("No se pudo leer el video completo");
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      },
      body: chunk as BodyInit,
      cache: "no-store",
    });
    const last = i === plan.ranges.length - 1;
    const expected = last ? [200, 201] : [206];
    if (!expected.includes(response.status)) {
      const text = await response.text().catch(() => "");
      throw new Error(`TikTok rechazó la parte ${i + 1} de ${plan.totalChunkCount} (HTTP ${response.status}${text ? `: ${text.slice(0, 120)}` : ""})`);
    }
  }
}

export type PublishStatus = "PROCESSING_UPLOAD" | "PROCESSING_DOWNLOAD" | "SEND_TO_USER_INBOX" | "PUBLISH_COMPLETE" | "FAILED";

/** POST /v2/post/publish/status/fetch/ (sirve con video.upload o video.publish). */
export async function fetchPublishStatus(accessToken: string, publishId: string) {
  const res = await fetchJson<{ data?: Json }>(`${API}/post/publish/status/fetch/`, {
    method: "POST",
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ publish_id: publishId }),
  });
  const data = res.data ?? {};
  // «publicaly» viene así escrito en la API de TikTok.
  const ids = Array.isArray(data.publicaly_available_post_id) ? data.publicaly_available_post_id.map(String) : [];
  return {
    status: String(data.status ?? "") as PublishStatus,
    failReason: data.fail_reason ? String(data.fail_reason) : null,
    postIds: ids,
  };
}

// ─── Errores de TikTok en palabras claras ───

const TIKTOK_API_ERROR_TEXT: Record<string, [string, string]> = {
  spam_risk_too_many_posts: ["Llegaste al límite de publicaciones de hoy en TikTok. Inténtalo mañana.", "You reached today's TikTok posting limit. Try again tomorrow."],
  spam_risk_user_banned_from_posting: ["TikTok no permite publicar desde esta cuenta por ahora.", "TikTok isn't allowing this account to post right now."],
  reached_active_user_cap: ["Foliocrew llegó a su cupo diario de cuentas que publican en TikTok. Inténtalo más tarde.", "Foliocrew reached its daily quota of accounts posting to TikTok. Try again later."],
  unaudited_client_can_only_post_to_private_accounts: [
    "Mientras TikTok no termine de revisar Foliocrew, solo se puede publicar en cuentas privadas: pon tu cuenta en privado e inténtalo de nuevo.",
    "Until TikTok finishes reviewing Foliocrew, posting only works on private accounts: make your account private and try again.",
  ],
  spam_risk_too_many_pending_share: [
    "Tienes 5 borradores sin terminar en la app de TikTok (el máximo por día). Publica o borra alguno y vuelve a intentarlo.",
    "You have 5 unfinished drafts in the TikTok app (the daily maximum). Post or delete one and try again.",
  ],
  privacy_level_option_mismatch: ["Esa privacidad ya no está disponible para tu cuenta. Vuelve a elegirla.", "That privacy option is no longer available for your account. Choose again."],
  rate_limit_exceeded: ["Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.", "Too many attempts in a row. Wait a minute and try again."],
};

/** Texto claro para un error conocido de la Content Posting API, o null. */
export function tiktokPostingErrorText(message: string): [string, string] | null {
  for (const [code, text] of Object.entries(TIKTOK_API_ERROR_TEXT)) if (message.includes(code)) return text;
  return null;
}
