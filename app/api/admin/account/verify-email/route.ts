import { NextResponse } from "next/server";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { emailConfigured } from "@/lib/email";
import { sendVerificationEmail } from "@/lib/account-emails";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Vuelve a mandar el enlace para confirmar el correo de la cuenta con sesión iniciada. */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.actorId) return NextResponse.json({ error: "Desde \"Entrar como\" no se mandan correos a la cuenta" }, { status: 403 });
  if (!emailConfigured()) return NextResponse.json({ error: "Los correos todavía no están configurados" }, { status: 503 });
  const user = await prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { emailVerifiedAt: true } });
  if (user?.emailVerifiedAt) return NextResponse.json({ ok: true, already: true });
  if (tooManyAttempts(`verify:${session.userId}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Ya te mandamos varios enlaces; revisa tu correo (y la carpeta de spam)" }, { status: 429 });
  }
  const result = await sendVerificationEmail(session.userId);
  if (!result?.sent) return NextResponse.json({ error: "No se pudo enviar el correo; intenta más tarde" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
