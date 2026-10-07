import { z } from "zod";
import { httpUrl } from "./validators";
import { CONTENT_TYPES, PLAN_NETWORKS, zonedToUtc } from "@/lib/content-plan";
import { appTimeZone } from "@/lib/growth-server";

// Sin valores por defecto: los PATCH parciales solo deben tocar los campos enviados.
export const postUpdateSchema = z.object({
  caption: z.string().max(10000),
  topic: z.string().trim().max(300).nullable().optional(),
  contentType: z.enum(CONTENT_TYPES),
  networks: z.array(z.enum(PLAN_NETWORKS)).min(1, "Elige al menos una red"),
  brandId: z.string().nullable().optional(),
  mediaUrl: httpUrl().nullable().optional().or(z.literal("")),
  mediaType: z.enum(["image", "video"]).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(["draft", "scheduled", "published"]),
  /** Publicar sola a la hora programada (solo si todas las redes elegidas lo permiten). */
  autoPublish: z.boolean().optional(),
});

/** Para crear: mismos campos, con valores por defecto. */
export const postSchema = postUpdateSchema.extend({
  caption: z.string().max(10000).default(""),
  status: z.enum(["draft", "scheduled", "published"]).default("scheduled"),
});

export type PostInput = z.infer<typeof postSchema>;

/** Entrada validada → datos de Prisma (fecha/hora local → instante UTC). */
export function toPostData(input: Partial<PostInput>) {
  const { date, time, mediaUrl, status, autoPublish, ...rest } = input;
  return {
    ...rest,
    ...(mediaUrl !== undefined && { mediaUrl: mediaUrl || null }),
    ...(date && time && { scheduledFor: zonedToUtc(date, time, appTimeZone()) }),
    ...(status !== undefined && { status, publishedAt: status === "published" ? new Date() : null }),
    ...(autoPublish !== undefined && { autoPublish }),
  };
}
