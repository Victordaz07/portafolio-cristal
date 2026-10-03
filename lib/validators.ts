import { z } from "zod";

/**
 * URL web (http o https). `z.string().url()` acepta cualquier protocolo, incluido `javascript:`, que en un enlace
 * del sitio público se ejecutaría al tocarlo: por eso todas las URLs que se guardan pasan por aquí.
 */
export const httpUrl = () =>
  z
    .string()
    .trim()
    .url()
    .refine((v) => /^https?:\/\//i.test(v), "El enlace tiene que empezar con https://");

/** Al mostrar un enlace guardado por una cuenta: solo http(s), mailto, tel o rutas del sitio; lo demás no se enlaza. */
export function safeHref(href: string | null | undefined): string | undefined {
  if (!href) return undefined;
  const v = href.trim();
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(v) ? v : undefined;
}
