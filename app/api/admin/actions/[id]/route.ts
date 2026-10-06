import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actionSchema } from "@/lib/growth-schemas";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = actionSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { done, ...rest } = parsed.data;
  const item = await prisma.actionItem.update({
    where: { id },
    data: {
      ...rest,
      // completedAt alimenta la racha de días activos.
      ...(done !== undefined && { done, completedAt: done ? new Date() : null }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.actionItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
