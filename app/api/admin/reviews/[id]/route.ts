import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const reviewUpdateSchema = z.object({
  photoUrl: z.string().url().nullable().optional().or(z.literal("")),
  category: z.string().min(1).optional(),
  categoryEn: z.string().nullable().optional().or(z.literal("")),
  title: z.string().min(1).optional(),
  titleEn: z.string().nullable().optional().or(z.literal("")),
  description: z.string().min(1).optional(),
  descriptionEn: z.string().nullable().optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5).optional(),
  order: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reviewUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.photoUrl === "") data.photoUrl = null;
  if (data.categoryEn === "") data.categoryEn = null;
  if (data.titleEn === "") data.titleEn = null;
  if (data.descriptionEn === "") data.descriptionEn = null;

  const review = await prisma.review.update({ where: { id }, data });
  return NextResponse.json(review);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
