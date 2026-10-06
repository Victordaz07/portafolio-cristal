import type { Brand, ScheduledPost } from "@prisma/client";
import { isPlanNetwork, utcToZoned } from "@/lib/content-plan";
import { needsDisclosureFix } from "@/lib/disclosure";

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
}

export function toPostView(post: ScheduledPost & { brand?: Pick<Brand, "name"> | null }, timeZone: string): PostView {
  const { dateKey, time } = utcToZoned(post.scheduledFor, timeZone);
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
  };
}
