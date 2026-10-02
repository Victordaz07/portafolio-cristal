import type { Brand, ScheduledPost } from "@prisma/client";
import { utcToZoned } from "@/lib/content-plan";

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
    dateKey,
    time,
  };
}
