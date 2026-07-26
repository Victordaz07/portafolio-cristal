import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const faqUpdateSchema = z.object({
  question: z.string().min(1).optional(),
  questionEn: z.string().nullable().optional().or(z.literal("")),
  answer: z.string().min(1).optional(),
  answerEn: z.string().nullable().optional().or(z.literal("")),
  order: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = faqUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.questionEn === "") data.questionEn = null;
  if (data.answerEn === "") data.answerEn = null;

  const faqItem = await prisma.faqItem.update({ where: { id }, data });
  return NextResponse.json(faqItem);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.faqItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
