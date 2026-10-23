import { SignJWT, jwtVerify } from "jose";

// Sesión de una cuenta de marca (Mercado de creadores): separada por completo de admin_session
// (lib/auth.ts). Una marca no tiene ni necesita una Creator detrás, así que esta sesión nunca pasa
// por getSession()/currentCreatorId() (lib/tenant.ts), que dan por hecho que siempre hay una
// creadora. Reutiliza AUTH_SECRET (ya configurado) para no sumar otra variable de entorno.

export const BRAND_SESSION_COOKIE = "brand_session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 días, igual que la sesión del panel

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no está configurado");
  return new TextEncoder().encode(secret);
}

export interface BrandSessionPayload {
  brandId: string;
  email: string;
  /** BrandAccount.sessionVersion al iniciar sesión: si cambia la contraseña, la sesión deja de valer. */
  sv?: number;
}

export async function createBrandSessionToken(session: BrandSessionPayload) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecretKey());
}

export async function verifyBrandSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.brandId !== "string" || typeof payload.email !== "string") return null;
    return payload as unknown as BrandSessionPayload;
  } catch {
    return null;
  }
}

export const brandSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION,
};
