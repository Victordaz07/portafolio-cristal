import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const contentCardUpdateSchema = z.object({
  type: z.enum(["video", "photo"]).optional(),
  platform: z.enum(["tiktok", "instagram", "facebook"]).optional(),
  postUrl: z.string().url().optional(),
  videoUrl: z.string().url().nullable().optional().or(z.literal("")),
  caption: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  statPrimary: z.string().nullable().optional().or(z.literal("")),
  statSecondary: z.string().nullable().optional().or(z.literal("")),
  order: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = contentCardUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.videoUrl === "") data.videoUrl = null;
  if (data.statPrimary === "") data.statPrimary = null;
  if (data.statSecondary === "") data.statSecondary = null;

  const card = await prisma.contentCard.update({ where: { id }, data });
  return NextResponse.json(card);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contentCard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
