import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const heroSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  niche: z.string().min(1),
  badgeLabel: z.string().min(1),
  headlinePlain: z.string().min(1),
  headlineEmphasis: z.string().min(1),
  headlineSuffix: z.string().optional().default(""),
  description: z.string().optional().default(""),
  photoUrl: z.string().url().optional().or(z.literal("")),
  ctaPrimaryLabel: z.string().min(1),
  ctaPrimaryHref: z.string().min(1),
  ctaSecondaryLabel: z.string().min(1),
  ctaSecondaryHref: z.string().min(1),
});

export async function GET() {
  const hero = await prisma.hero.findFirst();
  return NextResponse.json(hero);
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = heroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = { ...parsed.data, photoUrl: parsed.data.photoUrl || null };
  const existing = await prisma.hero.findFirst();

  const hero = existing
    ? await prisma.hero.update({ where: { id: existing.id }, data })
    : await prisma.hero.create({ data });

  return NextResponse.json(hero);
}
