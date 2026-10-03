import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma, prismaRoot } from "@/lib/prisma";
import { forgetSessionVersion, getSession } from "@/lib/tenant";
import { withSession } from "@/lib/creators";
import { sendPasswordChangedEmail } from "@/lib/account-emails";
import { changeAccountEmail } from "@/lib/account-email-change";
import { isPlatformAdminEmail } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

const accountSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "La contraseña nueva debe tener al menos 8 caracteres").max(200).optional(),
  email: z.string().trim().email("Escribe un correo válido").max(200).optional(),
  /** Confirma que, al dejar el correo de administración, esta cuenta pierde el panel de dueño. */
  confirmLoseAdmin: z.boolean().optional(),
});

/** Cambiar el nombre, la contraseña o el correo de acceso de la cuenta con sesión iniciada. */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.actorId) {
    return NextResponse.json({ error: "Desde \"Entrar como\" no se pueden cambiar el nombre, el correo ni la contraseña" }, { status: 403 });
  }
  const parsed = accountSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisa los datos" }, { status: 400 });
  }
  const { name, currentPassword, newPassword, email, confirmLoseAdmin } = parsed.data;
  const user = await prisma.adminUser.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });

  // Cambiar el correo de acceso: pide la contraseña actual, como cambiar la contraseña.
  if (email) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 });
    }
    if (isPlatformAdminEmail(user.email) && !isPlatformAdminEmail(email) && !confirmLoseAdmin) {
      return NextResponse.json(
        { error: "Este es el correo de administración de Foliocrew: si lo cambias, esta cuenta deja de ver el panel de dueño.", code: "lose-admin" },
        { status: 409 }
      );
    }
    const result = await changeAccountEmail(user.id, email);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return withSession(NextResponse.json({ ok: true, email: result.user.email }), result.user);
  }

  const data: { name?: string; passwordHash?: string; sessionVersion?: { increment: number } } = {};
  if (name) data.name = name;
  if (newPassword) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(newPassword, 12);
    // Cierra las sesiones de los otros equipos; esta sigue abierta con un token nuevo.
    data.sessionVersion = { increment: 1 };
  }
  const updated = await prisma.adminUser.update({ where: { id: user.id }, data });
  // El nombre de la cuenta dueña es también el nombre de la creadora.
  if (name && user.role === "owner") await prismaRoot.creator.update({ where: { id: session.creatorId }, data: { name } });
  if (!newPassword) return NextResponse.json({ ok: true });
  forgetSessionVersion(user.id);
  await sendPasswordChangedEmail(user.id).catch(() => {});
  return withSession(NextResponse.json({ ok: true }), updated);
}
