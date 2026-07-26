import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const testimonialUpdateSchema = z.object({
  quote: z.string().min(1).optional(),
  quoteEn: z.string().nullable().optional().or(z.literal("")),
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  roleEn: z.string().nullable().optional().or(z.literal("")),
  photoUrl: z.string().url().nullable().optional().or(z.literal("")),
  order: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = testimonialUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.photoUrl === "") data.photoUrl = null;
  if (data.quoteEn === "") data.quoteEn = null;
  if (data.roleEn === "") data.roleEn = null;

  const testimonial = await prisma.testimonial.update({ where: { id }, data });
  return NextResponse.json(testimonial);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.testimonial.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
