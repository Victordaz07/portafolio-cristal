import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prismaRoot } from "./prisma-root";
import { BRAND_SESSION_COOKIE, verifyBrandSessionToken } from "./brand-auth";

// A diferencia de la sesión del panel (lib/tenant.ts), esta lee la cookie directo: una marca
// siempre entra por el host de la plataforma (sin subdominio ni dominio propio), así que no hace
// falta la propagación por cabeceras del middleware que sí necesita el panel multi-dominio.

export interface BrandSession {
  brandId: string;
  email: string;
}

/** La marca con sesión iniciada, o null. */
export async function getBrandSession(): Promise<BrandSession | null> {
  const token = (await cookies()).get(BRAND_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyBrandSessionToken(token);
  if (!payload) return null;
  const state = await brandSessionState(payload.brandId);
  if (state === null || state !== (payload.sv ?? 0)) return null;
  return { brandId: payload.brandId, email: payload.email };
}

/** Para una página/acción exclusiva de marcas: exige sesión, si no, al login de marcas. */
export async function requireBrandAccount() {
  const session = await getBrandSession();
  if (!session) redirect("/marcas/login");
  return session;
}

// Versión de sesión de cada marca (caché corta, 30 s): al cambiar la contraseña sube y las
// sesiones abiertas dejan de valer, igual que sessionState() en lib/tenant.ts para AdminUser.
const brandSessionVersions = new Map<string, { version: number | null; expires: number }>();

async function brandSessionState(brandId: string) {
  let cached = brandSessionVersions.get(brandId);
  if (!cached || cached.expires <= Date.now()) {
    const brand = await prismaRoot.brandAccount.findUnique({ where: { id: brandId }, select: { sessionVersion: true } });
    cached = { version: brand?.sessionVersion ?? null, expires: Date.now() + 30_000 };
    brandSessionVersions.set(brandId, cached);
  }
  return cached.version;
}

/** Para borrar la caché cuando cambia la contraseña de una marca. */
export function forgetBrandSessionVersion(brandId: string) {
  brandSessionVersions.delete(brandId);
}
