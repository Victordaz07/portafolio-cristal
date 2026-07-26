import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const faqSchema = z.object({
  question: z.string().min(1),
  questionEn: z.string().optional().or(z.literal("")),
  answer: z.string().min(1),
  answerEn: z.string().optional().or(z.literal("")),
});

export async function GET() {
  const faqItems = await prisma.faqItem.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(faqItems);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const maxOrder = await prisma.faqItem.aggregate({ _max: { order: true } });
  const faqItem = await prisma.faqItem.create({
    data: {
      ...parsed.data,
      questionEn: parsed.data.questionEn || null,
      answerEn: parsed.data.answerEn || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(faqItem, { status: 201 });
}
