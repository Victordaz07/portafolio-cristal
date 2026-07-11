import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const contentCardSchema = z.object({
  type: z.enum(["video", "photo"]),
  platform: z.enum(["tiktok", "instagram", "facebook"]),
  postUrl: z.string().url(),
  caption: z.string().min(1),
  category: z.string().min(1),
  statPrimary: z.string().optional().or(z.literal("")),
  statSecondary: z.string().optional().or(z.literal("")),
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
      statPrimary: parsed.data.statPrimary || null,
      statSecondary: parsed.data.statSecondary || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
