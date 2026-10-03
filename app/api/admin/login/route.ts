import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, withSession } from "@/lib/creators";
import { prismaRoot } from "@/lib/prisma-root";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
  const creator = await prismaRoot.creator.findUnique({ where: { id: user.creatorId }, select: { status: true } });
  if (creator?.status !== "active") {
    return NextResponse.json(
      { error: "Esta cuenta está pausada. Escríbenos para reactivarla.", paused: true },
      { status: 403 }
    );
  }
  await prismaRoot.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return withSession(NextResponse.json({ ok: true }), user);
}
