import { prismaRoot } from "./prisma-root";
import { sendEmailChangedNotice, sendVerificationEmail } from "./account-emails";

export type EmailChangeResult =
  | { ok: true; user: { id: string; email: string; creatorId: string; sessionVersion: number }; previous: string }
  | { ok: false; error: string; status: number };

/**
 * Cambia el correo con el que una cuenta inicia sesión. Queda "sin confirmar", se borran los
 * enlaces pendientes (confirmar o restablecer) que iban al correo anterior, se manda el enlace
 * de confirmación al nuevo y un aviso de seguridad al anterior.
 */
export async function changeAccountEmail(userId: string, rawEmail: string): Promise<EmailChangeResult> {
  const email = rawEmail.trim().toLowerCase();
  const user = await prismaRoot.adminUser.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
  if (!user) return { ok: false, error: "Cuenta no encontrada", status: 404 };
  if (user.email === email) return { ok: false, error: "Ese ya es el correo de la cuenta", status: 400 };
  const taken = await prismaRoot.adminUser.findUnique({ where: { email }, select: { id: true } });
  if (taken) return { ok: false, error: "Ese correo ya lo usa otra cuenta de Foliocrew", status: 409 };

  let updated;
  try {
    [updated] = await prismaRoot.$transaction([
    prismaRoot.adminUser.update({
      where: { id: user.id },
      data: { email, emailVerifiedAt: null },
      select: { id: true, email: true, creatorId: true, sessionVersion: true },
    }),
    // Un enlace de "restablecer contraseña" mandado al correo anterior no debe seguir sirviendo.
    prismaRoot.authToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    ]);
  } catch {
    // Otra cuenta tomó ese correo justo ahora (índice único).
    return { ok: false, error: "Ese correo ya lo usa otra cuenta de Foliocrew", status: 409 };
  }
  await Promise.all([
    sendVerificationEmail(user.id).catch(() => {}),
    sendEmailChangedNotice(user.email, user.name, email).catch(() => {}),
  ]);
  return { ok: true, user: updated, previous: user.email };
}
