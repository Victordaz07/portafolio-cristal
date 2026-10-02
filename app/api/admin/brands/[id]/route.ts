import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandCrmInclude, brandFieldsSchema, toBrandData, autoEventNotes } from "@/lib/brand-crm";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = brandFieldsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const before = await prisma.brand.findUnique({
    where: { id },
    select: { dealStatus: true, paymentStatus: true },
  });
  if (!before) {
    return NextResponse.json({ error: "Marca no encontrada" }, { status: 404 });
  }

  const notes = autoEventNotes(before, parsed.data);
  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...toBrandData(parsed.data),
      events: notes.length ? { create: notes.map((note) => ({ note })) } : undefined,
    },
    include: brandCrmInclude,
  });
  return NextResponse.json(brand);
}

/** Soft-delete: desactiva la marca en vez de borrarla, para no perder el historial de colaboraciones. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await prisma.brand.update({
    where: { id },
    data: { active: false },
    include: brandCrmInclude,
  });
  return NextResponse.json(brand);
}
