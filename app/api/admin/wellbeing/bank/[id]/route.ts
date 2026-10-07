import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { bankSchema } from "@/lib/wellbeing-schemas";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = bankSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos de la idea", "Check the idea's details") }, { status: 400 });
  const { mediaUrl, ...rest } = parsed.data;
  const result = await prisma.contentBankItem.updateMany({ where: { id }, data: { ...rest, ...(mediaUrl !== undefined && { mediaUrl: mediaUrl || null }) } });
  if (!result.count) return NextResponse.json({ error: t("No se encontró la idea", "Idea not found") }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const result = await prisma.contentBankItem.deleteMany({ where: { id } });
  if (!result.count) return NextResponse.json({ error: t("No se encontró la idea", "Idea not found") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
