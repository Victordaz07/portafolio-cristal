import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logUpdateSchema } from "@/lib/growth-schemas";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = logUpdateSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const entry = await prisma.logEntry.update({ where: { id }, data: parsed.data });
  return NextResponse.json(entry);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.logEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
