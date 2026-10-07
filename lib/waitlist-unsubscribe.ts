import { createHmac, timingSafeEqual } from "node:crypto";

// Enlace de baja de los correos de la lista de espera. Va firmado (HMAC con AUTH_SECRET) para que nadie
// pueda dar de baja a otra persona adivinando su id. No vence: un enlace de baja tiene que servir siempre.

function sign(entryId: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no está configurado");
  return createHmac("sha256", secret).update(`waitlist-unsubscribe:${entryId}`).digest("base64url");
}

export function waitlistUnsubscribeUrl(origin: string, entryId: string) {
  return `${origin}/api/waitlist/unsubscribe?id=${encodeURIComponent(entryId)}&t=${sign(entryId)}`;
}

export function validUnsubscribeToken(entryId: string, token: string) {
  const expected = Buffer.from(sign(entryId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Cabeceras para que Gmail, Outlook y Apple Mail muestren su botón "Cancelar suscripción" (RFC 8058). */
export function unsubscribeHeaders(url: string) {
  return { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
}
