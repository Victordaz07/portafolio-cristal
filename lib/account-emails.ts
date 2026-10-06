import { prismaRoot } from "./prisma-root";
import { issueAuthToken } from "./auth-tokens";
import { sendEmail } from "./email";
import { emailChangedEmail, passwordChangedEmail, verifyEmail, welcomeEmail } from "./email-templates";
import { creatorSiteUrl, platformOrigin } from "./site-url";
import { asMailLang, mailLangFor } from "./email-lang";

// Correos de la cuenta (bienvenida, confirmar correo, aviso de contraseña cambiada).
// Nunca lanzan error: si el correo falla, la acción de la persona igual se completa.

async function userWithCreator(userId: string) {
  return prismaRoot.adminUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      language: true,
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
    lang: asMailLang(user.language),
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
  const mail = verifyEmail({ lang: asMailLang(user.language), origin, name: user.name, verifyUrl: `${origin}/api/admin/verify-email?token=${token}` });
  return sendEmail({ to: user.email, ...mail });
}

/** Aviso de seguridad: la contraseña cambió. */
export async function sendPasswordChangedEmail(userId: string) {
  const user = await userWithCreator(userId);
  if (!user) return;
  const origin = await platformOrigin();
  const mail = passwordChangedEmail({ lang: asMailLang(user.language), origin, name: user.name, forgotUrl: `${origin}/admin/recuperar` });
  return sendEmail({ to: user.email, ...mail });
}

/** Aviso de seguridad al correo ANTERIOR: la cuenta ahora entra con otro correo. */
export async function sendEmailChangedNotice(oldEmail: string, name: string | null, newEmail: string) {
  const origin = await platformOrigin();
  // El aviso va al correo anterior, pero la persona es la misma: usamos el idioma de su panel.
  const lang = await mailLangFor(newEmail);
  return sendEmail({ to: oldEmail, ...emailChangedEmail({ lang, origin, name, newEmail }) });
}
