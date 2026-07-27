import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const contentCardSchema = z
  .object({
    type: z.enum(["video", "photo"]),
    platform: z.enum(["tiktok", "instagram", "facebook"]),
    postUrl: z.string().url().optional().or(z.literal("")),
    videoUrl: z.string().url().optional().or(z.literal("")),
    photoUrl: z.string().url().optional().or(z.literal("")),
    caption: z.string().min(1),
    captionEn: z.string().optional().or(z.literal("")),
    category: z.string().min(1),
    categoryEn: z.string().optional().or(z.literal("")),
    statPrimary: z.string().optional().or(z.literal("")),
    statPrimaryEn: z.string().optional().or(z.literal("")),
    statSecondary: z.string().optional().or(z.literal("")),
    statSecondaryEn: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.postUrl || data.videoUrl || data.photoUrl, {
    message: "Debes indicar la URL del post o subir un video/foto propio",
    path: ["postUrl"],
  });

export async function GET() {
  const cards = await prisma.contentCard.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contentCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const maxOrder = await prisma.contentCard.aggregate({ _max: { order: true } });
  const card = await prisma.contentCard.create({
    data: {
      ...parsed.data,
      postUrl: parsed.data.postUrl || null,
      videoUrl: parsed.data.videoUrl || null,
      photoUrl: parsed.data.photoUrl || null,
      captionEn: parsed.data.captionEn || null,
      categoryEn: parsed.data.categoryEn || null,
      statPrimary: parsed.data.statPrimary || null,
      statPrimaryEn: parsed.data.statPrimaryEn || null,
      statSecondary: parsed.data.statSecondary || null,
      statSecondaryEn: parsed.data.statSecondaryEn || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
