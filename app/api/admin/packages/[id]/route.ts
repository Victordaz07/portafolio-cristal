import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const packageUpdateSchema = z.object({
  emoji: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  nameEn: z.string().nullable().optional().or(z.literal("")),
  items: z.array(z.string().min(1)).min(1).optional(),
  itemsEn: z.array(z.string().min(1)).optional(),
  order: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = packageUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.nameEn === "") data.nameEn = null;

  const pkg = await prisma.package.update({ where: { id }, data });
  return NextResponse.json(pkg);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.package.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
