import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, withSession } from "@/lib/creators";
import { prismaRoot } from "@/lib/prisma-root";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";
import { ADMIN_LANG_COOKIE, isAdminLang } from "@/lib/admin-lang";
import { afterFailure, isLocked } from "@/lib/login-guard";
import { checkSecondFactor, sendSecurityNotice } from "@/lib/two-factor";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  /** Segundo paso (si la cuenta lo tiene activo): código de la app o de recuperación. */
  code: z.string().trim().max(20).optional(),
});

/** Anota un intento fallido; al décimo seguido, la cuenta queda bloqueada 15 minutos. */
async function registerFailure(userId: string) {
  try {
    const { failedLogins } = await prismaRoot.adminUser.update({
      where: { id: userId },
      data: { failedLogins: { increment: 1 } },
      select: { failedLogins: true },
    });
    const next = afterFailure(failedLogins);
    if (next.lockedUntil) await prismaRoot.adminUser.update({ where: { id: userId }, data: next });
  } catch (error) {
    console.error("No se pudo anotar el intento fallido", error);
  }
}

export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  // Frena el adivinar contraseñas: por IP y por correo (10 intentos cada 15 min).
  const email = parsed.data.email.toLowerCase();
  if (tooManyAttempts(`login-ip:${clientIp(request)}`, 20, 15 * 60_000) || tooManyAttempts(`login:${email}`, 10, 15 * 60_000)) {
    return NextResponse.json(
      { error: t("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", "Too many attempts. Wait a few minutes and try again.") },
      { status: 429 }
    );
  }

  const tooMany = () =>
    NextResponse.json(
      { error: t("Demasiados intentos. Espera unos minutos e inténtalo de nuevo, o restablece tu contraseña.", "Too many attempts. Wait a few minutes and try again, or reset your password."), locked: true },
      { status: 429 }
    );
  const known = await prismaRoot.adminUser.findUnique({ where: { email }, select: { id: true, lockedUntil: true } });
  if (isLocked(known?.lockedUntil)) return tooMany();

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    if (known) await registerFailure(known.id);
    return NextResponse.json({ error: t("Correo o contraseña incorrectos", "Wrong email or password") }, { status: 401 });
  }

  // Segundo paso: con la contraseña correcta, falta el código de la app de autenticación.
  let usedRecoveryCode = false;
  if (user.totpEnabledAt) {
    const code = parsed.data.code;
    if (!code) {
      return NextResponse.json({ twoFactor: true, error: t("Escribe el código de tu app de autenticación", "Enter the code from your authenticator app") }, { status: 401 });
    }
    const factor = await checkSecondFactor(user, code);
    if (!factor) {
      await registerFailure(user.id);
      return NextResponse.json(
        { twoFactor: true, error: t("El código no es correcto o ya venció. Prueba con el que muestra tu app ahora.", "The code is wrong or has expired. Try the one your app shows now.") },
        { status: 401 }
      );
    }
    usedRecoveryCode = factor === "recovery";
  }
  const creator = await prismaRoot.creator.findUnique({ where: { id: user.creatorId }, select: { status: true } });
  if (creator?.status !== "active") {
    return NextResponse.json(
      { error: t("Esta cuenta está pausada. Escríbenos para reactivarla.", "This account is paused. Contact us to reactivate it."), paused: true },
      { status: 403 }
    );
  }
  await prismaRoot.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), failedLogins: 0, lockedUntil: null } });
  if (usedRecoveryCode) await sendSecurityNotice(user.id, "recovery-used");

  const response = await withSession(NextResponse.json({ ok: true }), user);
  // Si este navegador todavía no eligió idioma, usa el que guardó la cuenta.
  const hasCookie = request.headers.get("cookie")?.includes(`${ADMIN_LANG_COOKIE}=`);
  if (!hasCookie && isAdminLang(user.language)) {
    response.cookies.set(ADMIN_LANG_COOKIE, user.language, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}
