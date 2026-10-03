import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { OPTIONAL_TEXT, linkSchema } from "@/lib/bio-links";

export const dynamic = "force-dynamic";

// "wide" sin valor por defecto: al reordenar ({ order }) no se debe tocar.
const updateSchema = linkSchema.partial().extend({ wide: z.boolean().optional(), order: z.number().int().optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const d = parsed.data;
  if (d.groupId && !(await prisma.bioLinkGroup.findFirst({ where: { id: d.groupId, kind: "custom" }, select: { id: true } }))) {
    return NextResponse.json({ error: "Ese grupo no existe" }, { status: 400 });
  }
  const link = await prisma.bioLink.update({
    where: { id },
    data: {
      ...d,
      ...(d.section !== undefined ? { section: d.section ?? "" } : {}),
      ...Object.fromEntries(OPTIONAL_TEXT.filter((k) => d[k] !== undefined).map((k) => [k, d[k] || null])),
    },
  });
  return NextResponse.json(link);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.bioLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
