import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const serviceUpdateSchema = z.object({
  icon: z.enum(["camera", "chat", "box", "phone"]).optional(),
  title: z.string().min(1).optional(),
  titleEn: z.string().nullable().optional().or(z.literal("")),
  description: z.string().min(1).optional(),
  descriptionEn: z.string().nullable().optional().or(z.literal("")),
  order: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = serviceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.titleEn === "") data.titleEn = null;
  if (data.descriptionEn === "") data.descriptionEn = null;

  const service = await prisma.service.update({ where: { id }, data });
  return NextResponse.json(service);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
