import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  photoUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
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
      title: parsed.data.title,
      description: parsed.data.description,
      rating: parsed.data.rating,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
