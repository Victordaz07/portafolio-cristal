import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statUpdateSchema = z.object({
  label: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  icon: z.enum(["heart", "star", "chat"]).optional(),
  order: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = statUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const stat = await prisma.stat.update({ where: { id }, data: parsed.data });
  return NextResponse.json(stat);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.stat.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
