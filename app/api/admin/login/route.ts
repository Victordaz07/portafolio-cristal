import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, withSession } from "@/lib/creators";

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

  return withSession(NextResponse.json({ ok: true }), user);
}
