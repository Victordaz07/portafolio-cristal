import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  photoUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().min(1),
  categoryEn: z.string().optional().or(z.literal("")),
  title: z.string().min(1),
  titleEn: z.string().optional().or(z.literal("")),
  description: z.string().min(1),
  descriptionEn: z.string().optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5).optional().default(5),
});

export async function GET() {
  const reviews = await prisma.review.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const maxOrder = await prisma.review.aggregate({ _max: { order: true } });
  const review = await prisma.review.create({
    data: {
      photoUrl: parsed.data.photoUrl || null,
      category: parsed.data.category,
      categoryEn: parsed.data.categoryEn || null,
      title: parsed.data.title,
      titleEn: parsed.data.titleEn || null,
      description: parsed.data.description,
      descriptionEn: parsed.data.descriptionEn || null,
      rating: parsed.data.rating,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
