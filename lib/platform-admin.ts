import { prismaRoot } from "./prisma-root";
import { getSession } from "./tenant";

// Dueñas de la plataforma Foliocrew (ven la lista de espera y, más adelante, el panel de dueña).
// PLATFORM_ADMIN_EMAILS="tu@correo.com,otra@correo.com"; si no está, se usa ADMIN_EMAIL.
function adminEmails() {
  const list = process.env.PLATFORM_ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return list
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isPlatformAdmin() {
  const session = await getSession();
  if (!session) return false;
  const user = await prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { email: true } });
  return !!user && adminEmails().includes(user.email.toLowerCase());
}
