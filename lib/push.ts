import { z } from "zod";

// Avisos en el celular (E5, Web Push). Lógica pura (se prueba en tests/push.test.ts).

export const PUSH_TOPICS = [
  { id: "payment", label: "Te pagaron", labelEn: "You got paid", hint: "Cuando una factura se marca como pagada o la marca avisa que ya pagó.", hintEn: "When an invoice is marked paid or the brand says it paid." },
  { id: "comment", label: "Nuevo comentario", labelEn: "New comment", hint: "Comentarios nuevos en tu Instagram (cuando el aviso en tiempo real esté activo).", hintEn: "New comments on your Instagram (once real-time notices are active)." },
  { id: "deliverable", label: "Vence un entregable", labelEn: "A deliverable is due", hint: "Entregas que vencen pronto y derechos de uso por renovar.", hintEn: "Deliverables due soon and usage rights to renew." },
  { id: "community", label: "Comunidad", labelEn: "Community", hint: "Cuando te responden en la comunidad o eligen tu respuesta como la mejor.", hintEn: "When someone replies in the community or picks your answer as the best." },
] as const;
export type PushTopic = (typeof PUSH_TOPICS)[number]["id"];
export const isPushTopic = (v: string): v is PushTopic => PUSH_TOPICS.some((t) => t.id === v);
export const ALL_TOPICS: PushTopic[] = PUSH_TOPICS.map((t) => t.id);

/** Máximo de dispositivos por persona (el más viejo se reemplaza). */
export const MAX_DEVICES = 5;
/** Un mismo aviso (tema + clave) no se repite antes de este tiempo. */
export const DEDUPE_MS = 60_000;

/**
 * Redes de notificaciones de los navegadores. Se exige https y uno de estos dominios para que nadie pueda
 * hacer que el servidor envíe peticiones a una dirección cualquiera (SSRF).
 */
const PUSH_HOST_SUFFIXES = [".googleapis.com", ".push.services.mozilla.com", ".push.apple.com", ".notify.windows.com"];

export function isAllowedEndpoint(endpoint: string, extraHosts: string = process.env.PUSH_EXTRA_HOSTS ?? "") {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const extra = extraHosts.split(",").map((h) => h.trim()).filter(Boolean);
  if (extra.includes(url.host)) return true;
  if (url.port && url.port !== "443") return false;
  return PUSH_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix));
}

const b64url = z.string().min(8).max(300).regex(/^[A-Za-z0-9_-]+=*$/);
export const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: b64url, auth: b64url }),
  topics: z.array(z.string()).max(10).optional(),
});

export function cleanTopics(topics: readonly string[] | undefined): PushTopic[] {
  return Array.from(new Set((topics ?? ALL_TOPICS).filter(isPushTopic)));
}

export interface PushPayload {
  title: string;
  body: string;
  /** Ruta dentro del panel (empieza con /admin). */
  url: string;
  /** Agrupa avisos parecidos en el celular. */
  tag?: string;
}

/** La ruta solo puede ser del propio panel (nunca un enlace externo). */
export const safeUrl = (url: string) => (/^\/admin(\/[\w\-./?=&%]*)?$/.test(url) ? url : "/admin");

export function buildPayload(p: PushPayload): string {
  return JSON.stringify({ title: p.title.slice(0, 80), body: p.body.slice(0, 180), url: safeUrl(p.url), tag: p.tag?.slice(0, 60) });
}

/** El servicio de notificaciones dice que el dispositivo ya no existe: hay que borrarlo. */
export const isGoneStatus = (status: number | undefined) => status === 404 || status === 410;

/** Texto de los avisos más comunes (en el idioma de la persona). */
export function paymentNotice(kind: "paid" | "claimed", opts: { number: string; brand?: string; amount?: string }, lang: "es" | "en"): PushPayload {
  const who = opts.brand ? ` · ${opts.brand}` : "";
  const amount = opts.amount ? ` (${opts.amount})` : "";
  if (kind === "paid") return lang === "en" ? { title: "You got paid 💸", body: `Invoice ${opts.number}${who}${amount} was marked as paid.`, url: "/admin/facturas", tag: `inv-${opts.number}` } : { title: "¡Te pagaron! 💸", body: `La factura ${opts.number}${who}${amount} quedó pagada.`, url: "/admin/facturas", tag: `inv-${opts.number}` };
  return lang === "en" ? { title: "A brand says it paid", body: `${opts.brand ?? "A brand"} says invoice ${opts.number} is paid. Confirm it when you see the money.`, url: "/admin/facturas", tag: `inv-${opts.number}` } : { title: "Una marca dice que ya pagó", body: `${opts.brand ?? "Una marca"} avisa que la factura ${opts.number} está pagada. Confírmalo cuando veas el dinero.`, url: "/admin/facturas", tag: `inv-${opts.number}` };
}
