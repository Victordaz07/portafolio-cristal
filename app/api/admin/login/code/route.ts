import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateByCode, withSession } from "@/lib/creators";
import { normalizeAccessCode } from "@/lib/access-code";
import { prismaRoot } from "@/lib/prisma-root";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";
import { afterFailure, isLocked } from "@/lib/login-guard";

export const dynamic = "force-dynamic";

// Login de una creadora de una agencia (plan Crew) con su código de acceso, desde la landing de
// esa agencia (app/admin/login/page.tsx?agencia=<slug>). No usa contraseña ni 2FA — es un atajo
// adicional a su cuenta de siempre (ver lib/creators.ts::authenticateByCode).

const schema = z.object({
  email: z.string().email(),
  code: z.string().trim().min(1).max(20),
  agencySlug: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  if (tooManyAttempts(`login-code-ip:${clientIp(request)}`, 20, 15 * 60_000) || tooManyAttempts(`login-code:${email}`, 10, 15 * 60_000)) {
    return NextResponse.json(
      { error: t("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", "Too many attempts. Wait a few minutes and try again.") },
      { status: 429 }
    );
  }

  const agency = await prismaRoot.agency.findUnique({ where: { slug: parsed.data.agencySlug }, select: { id: true, status: true } });
  if (!agency || agency.status !== "active") return NextResponse.json({ error: t("Agencia no encontrada", "Agency not found") }, { status: 404 });

  const known = await prismaRoot.adminUser.findUnique({ where: { email }, select: { id: true, lockedUntil: true } });
  if (isLocked(known?.lockedUntil)) {
    return NextResponse.json(
      { error: t("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", "Too many attempts. Wait a few minutes and try again."), locked: true },
      { status: 429 }
    );
  }

  const code = normalizeAccessCode(parsed.data.code);
  const user = await authenticateByCode(email, code, agency.id);
  if (!user) {
    if (known) {
      const { failedLogins } = await prismaRoot.adminUser.update({ where: { id: known.id }, data: { failedLogins: { increment: 1 } }, select: { failedLogins: true } });
      const next = afterFailure(failedLogins);
      if (next.lockedUntil) await prismaRoot.adminUser.update({ where: { id: known.id }, data: next });
    }
    return NextResponse.json({ error: t("Correo o código incorrectos", "Wrong email or code") }, { status: 401 });
  }

  await prismaRoot.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), failedLogins: 0, lockedUntil: null } });
  const response = await withSession(NextResponse.json({ ok: true }), user, undefined, "code");
  return response;
}
