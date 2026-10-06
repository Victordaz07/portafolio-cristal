import { z } from "zod";
import { LIMITS, isCreatorType, isPostKind, isTopic } from "./community";

// Validación de lo que llega del navegador (compartida por crear y editar).

/** Enlace https o una ruta del propio sitio, nunca "javascript:" ni otro esquema. */
export const safeImageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v) || /^\/(?!\/)[^\s]*$/.test(v));

export const postSchema = z.object({
  kind: z.string().refine(isPostKind),
  topic: z.string().refine(isTopic).default("otro"),
  title: z.string().trim().min(LIMITS.title.min).max(LIMITS.title.max),
  body: z.string().trim().min(LIMITS.body.min).max(LIMITS.body.max),
  imageUrl: safeImageUrl.default(""),
  creatorTypes: z.array(z.string().refine(isCreatorType)).max(12).default([]),
});

export const replySchema = z.object({
  body: z.string().trim().min(LIMITS.reply.min).max(LIMITS.reply.max),
});
