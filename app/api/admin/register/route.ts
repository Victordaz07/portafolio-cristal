import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { createCreatorAccount, signupMode, slugProblem, withSession } from "@/lib/creators";
import { sendWelcomeEmail } from "@/lib/account-emails";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";
import { validationMessage } from "@/lib/admin-lang";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase(),
  email: z.string().trim().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
  inviteCode: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const { t, lang } = await getT();
  if (signupMode() === "closed") {
    return NextResponse.json({ error: t("El registro todavía no está abierto", "Sign-up isn't open yet") }, { status: 403 });
  }
  // Frena el adivinar el código de invitación y la creación masiva de cuentas.
  if (tooManyAttempts(`register:${clientIp(request)}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: t("Demasiados intentos. Espera un rato e inténtalo de nuevo.", "Too many attempts. Wait a bit and try again.") }, { status: 429 });
  }
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: validationMessage(t, parsed.error.issues[0]?.message) }, { status: 400 });
  }
  const { name, slug, email, password, inviteCode } = parsed.data;
  if (inviteCode !== process.env.SIGNUP_INVITE_CODE) {
    return NextResponse.json({ error: t("El código de invitación no es válido", "The invite code isn't valid") }, { status: 403 });
  }
  const problem = await slugProblem(slug, t);
  if (problem) return NextResponse.json({ error: problem, field: "slug" }, { status: 400 });
  if (await prismaRoot.adminUser.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } })) {
    return NextResponse.json({ error: t("Ya hay una cuenta con ese correo", "There's already an account with that email"), field: "email" }, { status: 409 });
  }

  const { user } = await createCreatorAccount({ name, slug, email, password, language: lang });
  await sendWelcomeEmail(user.id).catch((error) => console.error("No se pudo enviar la bienvenida", error));
  // Si se anotó en la lista de espera, queda marcada como cuenta creada.
  await prismaRoot.waitlistEntry
    .updateMany({ where: { email: email.toLowerCase() }, data: { status: "joined" } })
    .catch(() => {});
  return withSession(NextResponse.json({ ok: true }, { status: 201 }), user);
}
