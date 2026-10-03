import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ id: z.string().min(1).max(40) });

/** Cuenta un clic en un enlace del link en bio (lo manda el navegador con sendBeacon; nunca bloquea la visita). */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  // Una persona no infla los números: 1 clic por enlace por minuto desde la misma IP.
  if (tooManyAttempts(`link-click:${clientIp(request)}:${parsed.data.id}`, 1)) return NextResponse.json({ ok: true });
  // updateMany con el filtro de la cuenta del sitio: un id de otra cuenta no suma nada.
  await prisma.bioLink.updateMany({ where: { id: parsed.data.id }, data: { clicks: { increment: 1 } } });
  return NextResponse.json({ ok: true });
}
