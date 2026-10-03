import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { linkSchema } from "@/lib/bio-links";
import { z } from "zod";

export const dynamic = "force-dynamic";

// "wide" sin valor por defecto: al reordenar ({ order }) no se debe tocar.
const updateSchema = linkSchema.partial().extend({ wide: z.boolean().optional(), order: z.number().int().optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const d = parsed.data;
  const link = await prisma.bioLink.update({
    where: { id },
    data: {
      ...d,
      ...(d.titleEn !== undefined ? { titleEn: d.titleEn || null } : {}),
      ...(d.imageUrl !== undefined ? { imageUrl: d.imageUrl || null } : {}),
      ...(d.pill !== undefined ? { pill: d.pill || null } : {}),
    },
  });
  return NextResponse.json(link);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.bioLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
