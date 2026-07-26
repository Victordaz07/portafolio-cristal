import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const testimonialSchema = z.object({
  quote: z.string().min(1),
  quoteEn: z.string().optional().or(z.literal("")),
  name: z.string().min(1),
  role: z.string().min(1),
  roleEn: z.string().optional().or(z.literal("")),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(testimonials);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = testimonialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const maxOrder = await prisma.testimonial.aggregate({ _max: { order: true } });
  const testimonial = await prisma.testimonial.create({
    data: {
      quote: parsed.data.quote,
      quoteEn: parsed.data.quoteEn || null,
      name: parsed.data.name,
      role: parsed.data.role,
      roleEn: parsed.data.roleEn || null,
      photoUrl: parsed.data.photoUrl || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(testimonial, { status: 201 });
}
