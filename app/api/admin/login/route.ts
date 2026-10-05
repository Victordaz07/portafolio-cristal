import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, withSession } from "@/lib/creators";
import { prismaRoot } from "@/lib/prisma-root";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";
import { ADMIN_LANG_COOKIE, isAdminLang } from "@/lib/admin-lang";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return NextResponse.json({ error: t("Correo o contraseña incorrectos", "Wrong email or password") }, { status: 401 });
  const creator = await prismaRoot.creator.findUnique({ where: { id: user.creatorId }, select: { status: true } });
  if (creator?.status !== "active") {
    return NextResponse.json(
      { error: t("Esta cuenta está pausada. Escríbenos para reactivarla.", "This account is paused. Contact us to reactivate it."), paused: true },
      { status: 403 }
    );
  }
  await prismaRoot.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const response = await withSession(NextResponse.json({ ok: true }), user);
  // Si este navegador todavía no eligió idioma, usa el que guardó la cuenta.
  const hasCookie = request.headers.get("cookie")?.includes(`${ADMIN_LANG_COOKIE}=`);
  if (!hasCookie && isAdminLang(user.language)) {
    response.cookies.set(ADMIN_LANG_COOKIE, user.language, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}
