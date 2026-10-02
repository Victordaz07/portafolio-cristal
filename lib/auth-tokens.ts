import { createHash, randomBytes } from "node:crypto";
import { prismaRoot } from "./prisma-root";

// Enlaces de un solo uso que se mandan por correo. El token viaja solo en el enlace;
// en la base de datos se guarda su hash (SHA-256).

export type AuthTokenType = "reset" | "verify";

const LIFETIME_MS: Record<AuthTokenType, number> = {
  reset: 60 * 60 * 1000, // 1 hora
  verify: 3 * 24 * 60 * 60 * 1000, // 3 días
};

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Crea un token nuevo (y anula los anteriores del mismo tipo de ese usuario). Devuelve el token en claro. */
export async function issueAuthToken(userId: string, type: AuthTokenType) {
  const token = randomBytes(32).toString("base64url");
  await prismaRoot.$transaction([
    prismaRoot.authToken.updateMany({ where: { userId, type, usedAt: null }, data: { usedAt: new Date() } }),
    prismaRoot.authToken.create({
      data: { userId, type, tokenHash: hash(token), expiresAt: new Date(Date.now() + LIFETIME_MS[type]) },
    }),
  ]);
  return token;
}

/** Usa el token: si es válido, lo marca como usado y devuelve el userId. Si no, null. */
export async function consumeAuthToken(token: string, type: AuthTokenType) {
  if (!token || token.length > 200) return null;
  const record = await prismaRoot.authToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) return null;
  // updateMany con usedAt: null evita que dos clics al mismo tiempo usen el mismo token.
  const { count } = await prismaRoot.authToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
  return count ? record.userId : null;
}

/** ¿Sigue vigente el token? (para mostrar el formulario sin gastarlo). */
export async function authTokenIsValid(token: string, type: AuthTokenType) {
  if (!token || token.length > 200) return false;
  const record = await prismaRoot.authToken.findUnique({ where: { tokenHash: hash(token) } });
  return Boolean(record && record.type === type && !record.usedAt && record.expiresAt >= new Date());
}
