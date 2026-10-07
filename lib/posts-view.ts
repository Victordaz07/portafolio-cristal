import type { Brand, ScheduledPost } from "@prisma/client";
import { isPlanNetwork, utcToZoned } from "@/lib/content-plan";
import { needsDisclosureFix } from "@/lib/disclosure";
import { overallStatus, parseResults, publishEnabled, type NetResult, AUTO_NETWORKS } from "@/lib/publish";

/** Publicación lista para el cliente: fecha y hora ya convertidas a la zona horaria de la app. */
export interface PostView {
  id: string;
  caption: string;
  topic: string | null;
  contentType: string;
  networks: string[];
  brandId: string | null;
  brandName: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  status: string;
  /** Es para una marca y al texto le falta el aviso de publicidad (o está escondido). */
  disclosureIssue: boolean;
  dateKey: string;
  time: string;
  /** Publica sola a la hora programada (E2). */
  autoPublish: boolean;
  /** Se puede publicar ya desde el panel (todas sus redes tienen la publicación automática activa). */
  canPublishNow: boolean;
  /** Resultado por red de la publicación automática (solo lo que ya se intentó). */
  publish: { network: string; status: NetResult["status"]; url: string | null; error: string | null }[];
  publishOverall: string;
}

export function toPostView(post: ScheduledPost & { brand?: Pick<Brand, "name"> | null }, timeZone: string): PostView {
  const { dateKey, time } = utcToZoned(post.scheduledFor, timeZone);
  const results = parseResults(post.publishResults);
  return {
    id: post.id,
    caption: post.caption,
    topic: post.topic,
    contentType: post.contentType,
    networks: post.networks,
    brandId: post.brandId,
    brandName: post.brand?.name ?? null,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    status: post.status,
    disclosureIssue: post.status !== "published" && needsDisclosureFix(post.caption, post.networks.filter(isPlanNetwork), Boolean(post.brandId)),
    dateKey,
    time,
    autoPublish: post.autoPublish,
    canPublishNow: post.status !== "published" && post.networks.length > 0 && post.networks.every((n) => (AUTO_NETWORKS as readonly string[]).includes(n) && publishEnabled(n)),
    publish: AUTO_NETWORKS.filter((n) => results[n]).map((n) => ({ network: n, status: (results[n] as NetResult).status, url: results[n]?.url ?? null, error: results[n]?.error ?? null })),
    publishOverall: overallStatus(post.networks, results),
  };
}
