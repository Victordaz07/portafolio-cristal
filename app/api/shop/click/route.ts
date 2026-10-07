import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ id: z.string().min(1).max(40) });

/** Cuenta un clic en «Comprar» (lo manda el navegador con sendBeacon; nunca bloquea la visita). */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  // 1 clic por producto por minuto desde la misma IP: nadie infla los números.
  if (tooManyAttempts(`shop-click:${clientIp(request)}:${parsed.data.id}`, 1)) return NextResponse.json({ ok: true });
  // Solo productos activos del sitio actual (el filtro de cuenta lo pone lib/prisma.ts).
  await prisma.product.updateMany({ where: { id: parsed.data.id, active: true }, data: { clicks: { increment: 1 } } });
  return NextResponse.json({ ok: true });
}
