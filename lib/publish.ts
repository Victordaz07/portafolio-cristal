import { NETWORK_META, isPlanNetwork, type PlanNetwork } from "./content-plan";
import { needsDisclosureFix } from "./disclosure";

// Publicación automática desde el calendario (E2). Lógica pura (se prueba en tests/publish.test.ts).
// Por ahora solo Instagram y Facebook; TikTok y YouTube se publican a mano (necesitan aprobación de la app
// y, en YouTube, subir el video completo, algo que una función de servidor corta no puede hacer).

export const AUTO_NETWORKS = ["instagram", "facebook"] as const;
export type AutoNetwork = (typeof AUTO_NETWORKS)[number];
export const isAutoNetwork = (v: string): v is AutoNetwork => (AUTO_NETWORKS as readonly string[]).includes(v);

/** Permisos que cada red pide para publicar (solo se piden cuando el dueño activa la red). */
export const PUBLISH_SCOPE: Record<AutoNetwork, string> = {
  instagram: "instagram_business_content_publish",
  facebook: "pages_manage_posts",
};

/** La red solo publica cuando el dueño confirma (variable de entorno) que Meta aprobó el permiso. */
export function publishEnabled(network: string) {
  if (network === "instagram") return process.env.PUBLISH_INSTAGRAM_ENABLED === "1";
  if (network === "facebook") return process.env.PUBLISH_FACEBOOK_ENABLED === "1";
  return false;
}

/** Intentos máximos por publicación antes de dejarla para que la persona la revise. */
export const MAX_ATTEMPTS = 3;
/** Un intento reciente (menos de 2 minutos) bloquea a otro proceso para no publicar dos veces. */
export const ATTEMPT_LOCK_MS = 2 * 60_000;

export type NetResult = {
  status: "ok" | "error" | "pending";
  id?: string;
  url?: string;
  error?: string;
  /** Instagram: contenedor de video que aún se está procesando. */
  creationId?: string;
  at: string;
};
export type PublishResults = Partial<Record<AutoNetwork, NetResult>>;

export interface PostForPublish {
  networks: string[];
  contentType: string;
  mediaType: string | null;
  mediaUrl: string | null;
  caption: string;
  brandId: string | null;
}

export type PublishKind = "image" | "video" | "story_image" | "story_video" | "text";
export type PublishPlan = { ok: true; kind: PublishKind } | { ok: false; reason: "network" | "type" | "no_media" | "bad_media" | "mismatch" | "caption" | "disclosure" };

/** ¿Se puede publicar esta pieza en esta red tal como está? Si no, dice por qué. */
export function planPublish(post: PostForPublish, network: string): PublishPlan {
  if (!isAutoNetwork(network)) return { ok: false, reason: "network" };
  const limit = NETWORK_META[network as PlanNetwork].captionLimit;
  if (post.caption.length > limit) return { ok: false, reason: "caption" };
  // No se publica sola una pieza para una marca a la que le falta el aviso de publicidad (B5).
  if (needsDisclosureFix(post.caption, post.networks.filter(isPlanNetwork), Boolean(post.brandId))) return { ok: false, reason: "disclosure" };
  const hasMedia = Boolean(post.mediaUrl);
  if (hasMedia && !/^https:\/\//i.test(post.mediaUrl as string)) return { ok: false, reason: "bad_media" };
  const media = post.mediaType === "video" ? "video" : post.mediaType === "image" ? "image" : null;
  if (hasMedia && !media) return { ok: false, reason: "mismatch" };

  const type = post.contentType;
  if (network === "instagram") {
    if (!hasMedia) return { ok: false, reason: "no_media" };
    if (type === "post") return media === "image" ? { ok: true, kind: "image" } : { ok: false, reason: "mismatch" };
    if (type === "reel") return media === "video" ? { ok: true, kind: "video" } : { ok: false, reason: "mismatch" };
    if (type === "story") return { ok: true, kind: media === "video" ? "story_video" : "story_image" };
    return { ok: false, reason: "type" };
  }
  // Facebook (página)
  if (type === "post") return !hasMedia ? { ok: true, kind: "text" } : media === "image" ? { ok: true, kind: "image" } : { ok: true, kind: "video" };
  if (type === "reel" || type === "long_video") {
    if (!hasMedia) return { ok: false, reason: "no_media" };
    return media === "video" ? { ok: true, kind: "video" } : { ok: false, reason: "mismatch" };
  }
  return { ok: false, reason: "type" };
}

export const PLAN_REASON_TEXT: Record<Exclude<PublishPlan, { ok: true }>["reason"], [string, string]> = {
  network: ["Esta red se publica a mano", "This network is published by hand"],
  type: ["Este tipo de contenido no se puede publicar solo en esta red", "This content type can't be auto-published on this network"],
  no_media: ["Falta la foto o el video", "The photo or video is missing"],
  bad_media: ["El archivo debe tener un enlace seguro (https)", "The file must have a secure (https) link"],
  mismatch: ["El archivo no corresponde al tipo de contenido (foto vs. video)", "The file doesn't match the content type (photo vs. video)"],
  caption: ["El texto es más largo de lo que permite la red", "The caption is longer than the network allows"],
  disclosure: ["Falta el aviso de publicidad (#publicidad)", "The ad disclosure (#ad) is missing"],
};

/** La publicación automática solo se permite si TODAS las redes elegidas se publican solas. */
export const canAutoPublish = (networks: string[]) => networks.length > 0 && networks.every(isAutoNetwork);

export interface DueCandidate {
  status: string;
  autoPublish: boolean;
  scheduledFor: Date;
  publishAttempts: number;
  publishAttemptedAt: Date | null;
}

/** ¿Le toca publicarse ahora? (programada, con publicación automática, ya llegó la hora, sin pasarse de intentos y sin otro intento en curso) */
export function isDue(post: DueCandidate, now: Date = new Date()) {
  if (post.status !== "scheduled" || !post.autoPublish) return false;
  if (post.scheduledFor.getTime() > now.getTime()) return false;
  if (post.publishAttempts >= MAX_ATTEMPTS) return false;
  if (post.publishAttemptedAt && now.getTime() - post.publishAttemptedAt.getTime() < ATTEMPT_LOCK_MS) return false;
  return true;
}

/** Lee lo guardado en la base (lo que no tenga forma válida se descarta). */
export function parseResults(value: unknown): PublishResults {
  const out: PublishResults = {};
  if (!value || typeof value !== "object") return out;
  for (const network of AUTO_NETWORKS) {
    const r = (value as Record<string, unknown>)[network];
    if (r && typeof r === "object" && ["ok", "error", "pending"].includes((r as { status?: string }).status ?? "")) out[network] = r as NetResult;
  }
  return out;
}

export type Overall = "published" | "partial" | "pending" | "failed" | "none";

/** Estado general: «published» solo cuando TODAS las redes de la pieza quedaron publicadas. */
export function overallStatus(networks: string[], results: PublishResults): Overall {
  const wanted = networks.filter(isAutoNetwork);
  if (!wanted.length) return "none";
  const states = wanted.map((n) => results[n]?.status);
  if (states.every((s) => s === "ok")) return "published";
  if (states.some((s) => s === "pending")) return "pending";
  if (states.some((s) => s === "ok")) return "partial";
  return states.some((s) => s === "error") ? "failed" : "none";
}
