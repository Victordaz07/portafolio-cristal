import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { emailConfigured } from "@/lib/email";
import { sendVerificationEmail } from "@/lib/account-emails";
import { tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

/** Vuelve a mandar el enlace para confirmar el correo de la cuenta con sesión iniciada. */
export async function POST() {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: t("Desde \"Entrar como\" no se mandan correos a la cuenta", "While signed in as another account, emails aren't sent to it") }, { status: 403 });
  if (!emailConfigured()) return NextResponse.json({ error: t("Los correos todavía no están configurados", "Email isn't set up yet") }, { status: 503 });
  const user = await prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { emailVerifiedAt: true } });
  if (user?.emailVerifiedAt) return NextResponse.json({ ok: true, already: true });
  if (tooManyAttempts(`verify:${session.userId}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: t("Ya te mandamos varios enlaces; revisa tu correo (y la carpeta de spam)", "We already sent you several links; check your email (and spam folder)") }, { status: 429 });
  }
  const result = await sendVerificationEmail(session.userId);
  if (!result?.sent) return NextResponse.json({ error: t("No se pudo enviar el correo; intenta más tarde", "Couldn't send the email; try again later") }, { status: 502 });
  return NextResponse.json({ ok: true });
}
