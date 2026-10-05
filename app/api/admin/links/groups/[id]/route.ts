import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { groupSchema } from "@/lib/bio-links";
import { getT } from "@/lib/admin-lang-server";
import { validationMessage } from "@/lib/admin-lang";

export const dynamic = "force-dynamic";

const updateSchema = groupSchema.partial().extend({ hidden: z.boolean().optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: validationMessage(t, parsed.error.issues[0]?.message) }, { status: 400 });
  const group = await prisma.bioLinkGroup.findFirst({ where: { id }, select: { kind: true } });
  if (!group) return NextResponse.json({ error: t("No existe", "Not found") }, { status: 404 });
  const d = parsed.data;
  const updated = await prisma.bioLinkGroup.update({
    where: { id },
    data: {
      ...(d.hidden !== undefined ? { hidden: d.hidden } : {}),
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.titleEn !== undefined ? { titleEn: d.titleEn || null } : {}),
    },
  });
  return NextResponse.json(updated);
}

/** Borra un grupo propio y sus enlaces (los bloques automáticos solo se ocultan). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const group = await prisma.bioLinkGroup.findFirst({ where: { id }, select: { kind: true } });
  if (!group) return NextResponse.json({ error: t("No existe", "Not found") }, { status: 404 });
  if (group.kind !== "custom") return NextResponse.json({ error: t("Este bloque es automático: puedes ocultarlo", "This block is automatic: you can hide it") }, { status: 400 });
  await prisma.bioLinkGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
