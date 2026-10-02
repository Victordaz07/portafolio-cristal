import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandCrmInclude, brandFieldsSchema, toBrandData, autoEventNotes } from "@/lib/brand-crm";

export const dynamic = "force-dynamic";

const brandCreateSchema = brandFieldsSchema.required({ name: true });

export async function GET() {
  const brands = await prisma.brand.findMany({ orderBy: { order: "asc" }, include: brandCrmInclude });
  return NextResponse.json(brands);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = brandCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const maxOrder = await prisma.brand.aggregate({ _max: { order: true } });
  // El orden de una marca nueva siempre va al final del carrusel.
  const input = { ...parsed.data, order: undefined };
  const notes = autoEventNotes({ dealStatus: null, paymentStatus: null }, input);
  const brand = await prisma.brand.create({
    data: {
      ...(toBrandData(input) as { name: string }),
      active: input.active ?? true,
      order: (maxOrder._max.order ?? -1) + 1,
      events: notes.length ? { create: notes.map((note) => ({ note })) } : undefined,
    },
    include: brandCrmInclude,
  });

  return NextResponse.json(brand, { status: 201 });
}
