import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { forgetSessionVersion, getSession } from "@/lib/tenant";
import { withSession } from "@/lib/creators";
import { siteConfig } from "@/lib/site-config";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";
import { formatSecret, generateRecoveryCodes, generateTotpSecret, hashRecoveryCode, otpauthUrl, verifyTotp } from "@/lib/totp";
import { checkSecondFactor, clearTwoFactor, openSecret, qrDataUrl, sealSecret, sendSecurityNotice, twoFactorAvailable } from "@/lib/two-factor";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  /** Empezar: pide la contraseña y devuelve el QR. No queda activa hasta confirmar un código. */
  z.object({ action: z.literal("start"), password: z.string().min(1).max(200) }),
  /** Confirmar el primer código de la app: queda activa y se entregan los códigos de recuperación. */
  z.object({ action: z.literal("confirm"), code: z.string().trim().min(6).max(12) }),
  /** Desactivar: contraseña + un código (de la app o de recuperación). */
  z.object({ action: z.literal("disable"), password: z.string().min(1).max(200), code: z.string().trim().min(6).max(20) }),
  /** Códigos de recuperación nuevos (los anteriores dejan de servir). */
  z.object({ action: z.literal("recovery"), password: z.string().min(1).max(200), code: z.string().trim().min(6).max(20) }),
]);

export async function POST(request: Request) {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  if (session.actorId) {
    return NextResponse.json({ error: t("Desde \"Entrar como\" no se puede cambiar la seguridad de la cuenta", "While signed in as another account you can't change its security settings") }, { status: 403 });
  }
  // Frena el adivinar la contraseña o el código con una sesión robada.
  if (tooManyAttempts(`2fa:${session.userId}`, 10, 15 * 60_000) || tooManyAttempts(`2fa-ip:${clientIp(request)}`, 30, 15 * 60_000)) {
    return NextResponse.json({ error: t("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", "Too many attempts. Wait a few minutes and try again.") }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const input = parsed.data;

  const user = await prismaRoot.adminUser.findUnique({ where: { id: session.userId } });
  if (!user || user.creatorId !== session.creatorId) return NextResponse.json({ error: t("Cuenta no encontrada", "Account not found") }, { status: 404 });

  const wrongPassword = () => NextResponse.json({ error: t("La contraseña no es correcta", "The password is incorrect") }, { status: 400 });
  const wrongCode = () => NextResponse.json({ error: t("El código no es correcto o ya venció. Prueba con el que muestra tu app ahora.", "The code is wrong or has expired. Try the one your app shows now.") }, { status: 400 });

  if (input.action === "start") {
    if (!twoFactorAvailable()) {
      return NextResponse.json({ error: t("La verificación en dos pasos todavía no está disponible en Foliocrew.", "Two-step verification isn't available on Foliocrew yet.") }, { status: 503 });
    }
    if (user.totpEnabledAt) return NextResponse.json({ error: t("Ya la tienes activa", "It's already on") }, { status: 409 });
    if (!(await bcrypt.compare(input.password, user.passwordHash))) return wrongPassword();
    const secret = generateTotpSecret();
    await prismaRoot.adminUser.update({ where: { id: user.id }, data: { totpSecret: sealSecret(secret), totpLastStep: null, totpRecoveryCodes: [] } });
    const otpauth = otpauthUrl(siteConfig.platformName, user.email, secret);
    return NextResponse.json({ ok: true, secret: formatSecret(secret), qr: await qrDataUrl(otpauth) });
  }

  if (input.action === "confirm") {
    if (user.totpEnabledAt) return NextResponse.json({ error: t("Ya la tienes activa", "It's already on") }, { status: 409 });
    const secret = openSecret(user.totpSecret);
    if (!secret) return NextResponse.json({ error: t("Empieza de nuevo: toca «Activar».", "Start again: tap “Turn on”.") }, { status: 400 });
    const step = verifyTotp(secret, input.code);
    if (step === null) return wrongCode();
    const recoveryCodes = generateRecoveryCodes();
    const updated = await prismaRoot.adminUser.update({
      where: { id: user.id },
      data: {
        totpEnabledAt: new Date(),
        totpLastStep: step,
        totpRecoveryCodes: recoveryCodes.map(hashRecoveryCode),
        // Cierra las sesiones abiertas en otros equipos; esta sigue con un token nuevo.
        sessionVersion: { increment: 1 },
      },
    });
    forgetSessionVersion(user.id);
    await sendSecurityNotice(user.id, "enabled");
    return withSession(NextResponse.json({ ok: true, recoveryCodes }), updated);
  }

  // Desactivar o regenerar códigos: contraseña + segundo paso.
  if (!user.totpEnabledAt) return NextResponse.json({ error: t("No la tienes activa", "It isn't on") }, { status: 409 });
  if (!(await bcrypt.compare(input.password, user.passwordHash))) return wrongPassword();
  if (!(await checkSecondFactor(user, input.code))) return wrongCode();

  if (input.action === "recovery") {
    const recoveryCodes = generateRecoveryCodes();
    await prismaRoot.adminUser.update({ where: { id: user.id }, data: { totpRecoveryCodes: recoveryCodes.map(hashRecoveryCode) } });
    await sendSecurityNotice(user.id, "recovery-regenerated");
    return NextResponse.json({ ok: true, recoveryCodes });
  }

  const updated = await clearTwoFactor(user.id);
  forgetSessionVersion(user.id);
  await sendSecurityNotice(user.id, "disabled");
  return withSession(NextResponse.json({ ok: true }), updated);
}
