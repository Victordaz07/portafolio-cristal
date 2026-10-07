import { createHmac, timingSafeEqual } from "node:crypto";

// Solo para el servidor (usa node:crypto): no se importa desde componentes del navegador.

/** Verifica la firma `X-Hub-Signature-256` que Meta pone en cada aviso (HMAC-SHA256 del cuerpo con el secreto de la app). */
export function verifySignature(rawBody: string, header: string | null, secret: string | undefined) {
  if (!secret || !header || !header.startsWith("sha256=")) return false;
  const given = Buffer.from(header.slice(7), "hex");
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  return given.length === expected.length && timingSafeEqual(given, expected);
}
