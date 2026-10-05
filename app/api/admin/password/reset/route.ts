import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { withSession } from "@/lib/creators";
import { forgetSessionVersion } from "@/lib/tenant";
import { sendPasswordChangedEmail } from "@/lib/account-emails";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";
import { validationMessage } from "@/lib/admin-lang";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

/** Guarda la contraseña nueva con el enlace del correo, cierra las otras sesiones y entra. */
export async function POST(request: Request) {
  const { t } = await getT();
  if (tooManyAttempts(`reset:${clientIp(request)}`, 10)) {
    return NextResponse.json({ error: t("Demasiados intentos; prueba en un minuto", "Too many attempts; try again in a minute") }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: validationMessage(t, parsed.error.issues[0]?.message) }, { status: 400 });
  }
  const userId = await consumeAuthToken(parsed.data.token, "reset");
  if (!userId) {
    return NextResponse.json({ error: t("El enlace venció o ya se usó. Pide uno nuevo.", "The link expired or was already used. Request a new one.") }, { status: 400 });
  }
  const user = await prismaRoot.adminUser.update({
    where: { id: userId },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      sessionVersion: { increment: 1 },
      // Abrió el enlace que llegó a su correo: el correo queda confirmado.
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });
  forgetSessionVersion(user.id);
  await sendPasswordChangedEmail(user.id).catch(() => {});
  return withSession(NextResponse.json({ ok: true }), user);
}
