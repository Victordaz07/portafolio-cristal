import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { MAX_MESSAGE } from "@/lib/comment-trigger";

export const dynamic = "force-dynamic";

const schema = z.object({ active: z.boolean().optional(), message: z.string().trim().min(1).max(MAX_MESSAGE).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa el mensaje (máximo 900 caracteres)", "Check the message (max 900 characters)") }, { status: 400 });
  const result = await prisma.commentTrigger.updateMany({ where: { id }, data: parsed.data });
  if (!result.count) return NextResponse.json({ error: t("No se encontró la regla", "Rule not found") }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const result = await prisma.commentTrigger.deleteMany({ where: { id } });
  if (!result.count) return NextResponse.json({ error: t("No se encontró la regla", "Rule not found") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
