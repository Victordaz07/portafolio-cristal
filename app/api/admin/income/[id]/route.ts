import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const result = await prisma.incomeEntry.deleteMany({ where: { id } });
  if (!result.count) return NextResponse.json({ error: t("No se encontró", "Not found") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
