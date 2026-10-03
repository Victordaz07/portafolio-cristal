import { z } from "zod";

// Enlaces de la página "link en bio" (/enlaces). Solo http(s) o mailto: nada de javascript: ni rutas raras.
export const MAX_LINKS = 30;

export const linkUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^(https?:\/\/|mailto:)/i.test(v), "El enlace tiene que empezar con https://");

export const linkSchema = z.object({
  title: z.string().trim().min(1, "Escribe un título").max(80),
  titleEn: z.string().trim().max(80).optional().or(z.literal("")),
  url: linkUrl,
  imageUrl: z.union([z.string().url(), z.string().regex(/^\/[^\s]*$/), z.literal("")]).nullable().optional(),
  pill: z.string().trim().max(14).optional().or(z.literal("")),
  wide: z.boolean().default(true),
});
