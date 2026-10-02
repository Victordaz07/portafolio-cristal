import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// Cifrado AES-256-GCM para los tokens de redes sociales guardados en la base de datos.
// La clave sale de TOKEN_ENCRYPTION_KEY (cualquier texto largo y aleatorio).

const PREFIX = "v1:";

function getKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("TOKEN_ENCRYPTION_KEY no está configurado");
  return createHash("sha256").update(secret).digest();
}

export function isTokenEncryptionConfigured() {
  return !!process.env.TOKEN_ENCRYPTION_KEY;
}

export function encryptToken(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}

export function decryptToken(stored: string) {
  if (!stored.startsWith(PREFIX)) throw new Error("Token con formato desconocido");
  const raw = Buffer.from(stored.slice(PREFIX.length), "base64");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}
