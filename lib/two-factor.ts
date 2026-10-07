import QRCode from "qrcode";
import { prismaRoot } from "./prisma-root";
import { decryptToken, encryptToken, isTokenEncryptionConfigured } from "./token-crypto";
import { hashRecoveryCode, looksLikeRecoveryCode, verifyTotp } from "./totp";
import { sendEmail } from "./email";
import { noticeEmail } from "./email-templates";
import { asMailLang } from "./email-lang";
import { platformOrigin } from "./site-url";

// Verificación en dos pasos: la parte que toca la base de datos y los correos.
// La clave de cada persona se guarda cifrada con TOKEN_ENCRYPTION_KEY (la misma que protege los
// tokens de las redes): sin esa variable no se puede activar.

export function twoFactorAvailable() {
  return isTokenEncryptionConfigured();
}

export const sealSecret = (secret: string) => encryptToken(secret);

/** La clave en claro, o null si no hay o no se puede descifrar (cambió TOKEN_ENCRYPTION_KEY). */
export function openSecret(stored: string | null | undefined) {
  if (!stored) return null;
  try {
    return decryptToken(stored);
  } catch (error) {
    console.error("No se pudo descifrar la clave de verificación en dos pasos", error);
    return null;
  }
}

/** El código QR (SVG en una data URL) que se escanea con la app de autenticación. */
export async function qrDataUrl(otpauth: string) {
  const svg = await QRCode.toString(otpauth, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

interface SecondFactorUser {
  id: string;
  totpSecret: string | null;
  totpLastStep: number | null;
  totpRecoveryCodes: string[];
}

/**
 * Comprueba el segundo paso: el código de 6 dígitos de la app o un código de recuperación.
 * Si vale, lo deja gastado (el de la app no se repite; el de recuperación se borra).
 */
export async function checkSecondFactor(user: SecondFactorUser, code: string): Promise<"totp" | "recovery" | null> {
  if (looksLikeRecoveryCode(code)) {
    const hash = hashRecoveryCode(code);
    if (!user.totpRecoveryCodes.includes(hash)) return null;
    // updateMany con `has` evita que el mismo código entre dos veces a la vez.
    const { count } = await prismaRoot.adminUser.updateMany({
      where: { id: user.id, totpRecoveryCodes: { has: hash } },
      data: { totpRecoveryCodes: user.totpRecoveryCodes.filter((h) => h !== hash) },
    });
    return count ? "recovery" : null;
  }
  const secret = openSecret(user.totpSecret);
  if (!secret) return null;
  const step = verifyTotp(secret, code, { lastStep: user.totpLastStep });
  if (step === null) return null;
  const { count } = await prismaRoot.adminUser.updateMany({
    where: { id: user.id, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
    data: { totpLastStep: step },
  });
  return count ? "totp" : null;
}

/** Quita la verificación en dos pasos de una persona (ella misma, o soporte si perdió el teléfono). */
export async function clearTwoFactor(userId: string) {
  return prismaRoot.adminUser.update({
    where: { id: userId },
    data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null, totpRecoveryCodes: [], sessionVersion: { increment: 1 } },
  });
}

type SecurityNotice = "enabled" | "disabled" | "reset-by-support" | "recovery-used" | "recovery-regenerated";

const NOTICES: Record<SecurityNotice, { es: [string, string]; en: [string, string] }> = {
  enabled: {
    es: ["Activaste la verificación en dos pasos", "Desde ahora, para entrar a tu panel hace falta tu contraseña y un código de tu app de autenticación."],
    en: ["You turned on two-step verification", "From now on, signing in to your dashboard takes your password and a code from your authenticator app."],
  },
  disabled: {
    es: ["Se desactivó la verificación en dos pasos", "Tu cuenta vuelve a entrar solo con la contraseña. Puedes activarla otra vez desde Mi cuenta."],
    en: ["Two-step verification was turned off", "Your account signs in with just the password again. You can turn it back on from My account."],
  },
  "reset-by-support": {
    es: ["El equipo quitó la verificación en dos pasos de tu cuenta", "Lo hicimos para que puedas volver a entrar. Actívala de nuevo desde Mi cuenta cuando tengas tu teléfono."],
    en: ["The team removed two-step verification from your account", "We did it so you can sign in again. Turn it back on from My account once you have your phone."],
  },
  "recovery-used": {
    es: ["Se usó un código de recuperación para entrar", "Alguien entró a tu cuenta con uno de tus códigos de recuperación. Ese código ya no sirve."],
    en: ["A recovery code was used to sign in", "Someone signed in to your account with one of your recovery codes. That code no longer works."],
  },
  "recovery-regenerated": {
    es: ["Generaste códigos de recuperación nuevos", "Los códigos de recuperación anteriores ya no sirven. Guarda los nuevos en un lugar seguro."],
    en: ["You generated new recovery codes", "Your previous recovery codes no longer work. Keep the new ones somewhere safe."],
  },
};

/** Aviso por correo de cada cambio de seguridad: si no fuiste tú, te enteras. Nunca lanza error. */
export async function sendSecurityNotice(userId: string, kind: SecurityNotice) {
  try {
    const user = await prismaRoot.adminUser.findUnique({ where: { id: userId }, select: { email: true, name: true, language: true } });
    if (!user) return;
    const lang = asMailLang(user.language);
    const origin = await platformOrigin();
    const [title, line] = NOTICES[kind][lang];
    const mail = noticeEmail({
      lang,
      origin,
      name: user.name,
      subject: `${title} · Foliocrew`,
      title,
      lines: [line],
      button: { label: lang === "en" ? "Open My account" : "Abrir Mi cuenta", url: `${origin}/admin/cuenta#seguridad` },
      note:
        lang === "en"
          ? "If this wasn't you, change your password right away and reply to this email."
          : "Si no fuiste tú, cambia tu contraseña ahora mismo y responde este correo.",
    });
    await sendEmail({ to: user.email, ...mail });
  } catch (error) {
    console.error("No se pudo enviar el aviso de seguridad", error);
  }
}
