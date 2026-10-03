import { prismaRoot } from "./prisma-root";
import { getSession } from "./tenant";

// Quien administra la plataforma Foliocrew (ve Cuentas y Lista de espera).
// PLATFORM_ADMIN_EMAILS="tu@correo.com,otro@correo.com"; si no está, se usa ADMIN_EMAIL.
function adminEmails() {
  const list = process.env.PLATFORM_ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return list
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string) {
  return adminEmails().includes(email.toLowerCase());
}

/** El usuario administrador con sesión iniciada (no cuenta mientras está "entrando como" otra cuenta). */
export async function platformAdminUser() {
  const session = await getSession();
  if (!session || session.actorId) return null;
  const user = await prismaRoot.adminUser.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, creatorId: true, name: true },
  });
  return user && isPlatformAdminEmail(user.email) ? user : null;
}

export async function isPlatformAdmin() {
  return Boolean(await platformAdminUser());
}

/** Deja constancia de una acción de administración (pausar, entrar como, notas). */
export async function logPlatformAction(actorEmail: string, action: string, creatorId: string | null, detail?: string) {
  await prismaRoot.platformAction
    .create({ data: { actorEmail, action, creatorId, detail: detail?.slice(0, 500) } })
    .catch((error) => console.error("No se pudo registrar la acción de administración", error));
}
