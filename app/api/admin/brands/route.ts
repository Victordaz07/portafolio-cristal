import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const brandSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  active: z.boolean().optional().default(true),
});

export async function GET() {
  const brands = await prisma.brand.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(brands);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const maxOrder = await prisma.brand.aggregate({ _max: { order: true } });
  const brand = await prisma.brand.create({
    data: {
      name: parsed.data.name,
      logoUrl: parsed.data.logoUrl || null,
      websiteUrl: parsed.data.websiteUrl || null,
      active: parsed.data.active,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(brand, { status: 201 });
}
