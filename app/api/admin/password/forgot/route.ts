import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { issueAuthToken } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates";
import { platformOrigin } from "@/lib/site-url";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(200) });

/** Pide el enlace para restablecer la contraseña. Siempre responde igual, exista o no la cuenta. */
export async function POST(request: Request) {
  const { t } = await getT();
  if (tooManyAttempts(`forgot:${clientIp(request)}`, 5)) {
    return NextResponse.json({ error: t("Demasiados intentos; prueba en un minuto", "Too many attempts; try again in a minute") }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe un correo válido", "Enter a valid email") }, { status: 400 });
  const { email } = parsed.data;

  // Máximo 3 correos por hora a la misma dirección.
  if (!tooManyAttempts(`forgot-mail:${email}`, 3, 60 * 60 * 1000)) {
    const user = await prismaRoot.adminUser.findUnique({ where: { email }, select: { id: true, name: true, language: true } });
    if (user) {
      const origin = await platformOrigin();
      const token = await issueAuthToken(user.id, "reset");
      const mail = passwordResetEmail({ lang: user.language === "en" ? "en" : "es", origin, name: user.name, resetUrl: `${origin}/admin/restablecer?token=${token}` });
      await sendEmail({ to: email, ...mail });
    }
  }
  return NextResponse.json({ ok: true });
}
