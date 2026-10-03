import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_LINKS, linkSchema } from "@/lib/bio-links";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await prisma.bioLink.findMany({ orderBy: { order: "asc" } }));
}

export async function POST(request: Request) {
  const parsed = linkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  if ((await prisma.bioLink.count()) >= MAX_LINKS) return NextResponse.json({ error: `Máximo ${MAX_LINKS} enlaces` }, { status: 400 });
  const max = await prisma.bioLink.aggregate({ _max: { order: true } });
  const link = await prisma.bioLink.create({
    data: {
      title: parsed.data.title,
      titleEn: parsed.data.titleEn || null,
      url: parsed.data.url,
      imageUrl: parsed.data.imageUrl || null,
      pill: parsed.data.pill || null,
      wide: parsed.data.wide,
      order: (max._max.order ?? -1) + 1,
    },
  });
  return NextResponse.json(link, { status: 201 });
}
