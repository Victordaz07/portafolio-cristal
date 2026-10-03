import { prismaRoot } from "./prisma-root";
import { issueAuthToken } from "./auth-tokens";
import { sendEmail } from "./email";
import { emailChangedEmail, passwordChangedEmail, verifyEmail, welcomeEmail } from "./email-templates";
import { creatorSiteUrl, platformOrigin } from "./site-url";

// Correos de la cuenta (bienvenida, confirmar correo, aviso de contraseña cambiada).
// Nunca lanzan error: si el correo falla, la acción de la persona igual se completa.

async function userWithCreator(userId: string) {
  return prismaRoot.adminUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      creator: { select: { slug: true, customDomain: true, customDomainVerifiedAt: true } },
    },
  });
}

/** Correo de bienvenida al crear la cuenta, con el enlace para confirmar el correo. */
export async function sendWelcomeEmail(userId: string) {
  const user = await userWithCreator(userId);
  if (!user) return;
  const origin = await platformOrigin();
  const token = await issueAuthToken(user.id, "verify");
  const mail = welcomeEmail({
    origin,
    name: user.name,
    siteUrl: await creatorSiteUrl(user.creator),
    panelUrl: `${origin}/admin`,
    verifyUrl: `${origin}/api/admin/verify-email?token=${token}`,
  });
  return sendEmail({ to: user.email, ...mail });
}

/** Vuelve a mandar el enlace para confirmar el correo. */
export async function sendVerificationEmail(userId: string) {
  const user = await userWithCreator(userId);
  if (!user) return;
  const origin = await platformOrigin();
  const token = await issueAuthToken(user.id, "verify");
  const mail = verifyEmail({ origin, name: user.name, verifyUrl: `${origin}/api/admin/verify-email?token=${token}` });
  return sendEmail({ to: user.email, ...mail });
}

/** Aviso de seguridad: la contraseña cambió. */
export async function sendPasswordChangedEmail(userId: string) {
  const user = await userWithCreator(userId);
  if (!user) return;
  const origin = await platformOrigin();
  const mail = passwordChangedEmail({ origin, name: user.name, forgotUrl: `${origin}/admin/recuperar` });
  return sendEmail({ to: user.email, ...mail });
}

/** Aviso de seguridad al correo ANTERIOR: la cuenta ahora entra con otro correo. */
export async function sendEmailChangedNotice(oldEmail: string, name: string | null, newEmail: string) {
  const origin = await platformOrigin();
  return sendEmail({ to: oldEmail, ...emailChangedEmail({ origin, name, newEmail }) });
}
