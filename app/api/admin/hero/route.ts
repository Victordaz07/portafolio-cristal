import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const heroSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  niche: z.string().min(1),
  nicheEn: z.string().optional().or(z.literal("")),
  badgeLabel: z.string().min(1),
  badgeLabelEn: z.string().optional().or(z.literal("")),
  headlinePlain: z.string().min(1),
  headlinePlainEn: z.string().optional().or(z.literal("")),
  headlineEmphasis: z.string().min(1),
  headlineEmphasisEn: z.string().optional().or(z.literal("")),
  headlineSuffix: z.string().optional().default(""),
  headlineSuffixEn: z.string().optional().or(z.literal("")),
  description: z.string().optional().default(""),
  descriptionEn: z.string().optional().or(z.literal("")),
  photoUrl: z.string().url().optional().or(z.literal("")),
  photoUrlMobile: z.string().url().optional().or(z.literal("")),
  ctaPrimaryLabel: z.string().min(1),
  ctaPrimaryLabelEn: z.string().optional().or(z.literal("")),
  ctaPrimaryHref: z.string().min(1),
  ctaSecondaryLabel: z.string().min(1),
  ctaSecondaryLabelEn: z.string().optional().or(z.literal("")),
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

  const data = {
    ...parsed.data,
    photoUrl: parsed.data.photoUrl || null,
    photoUrlMobile: parsed.data.photoUrlMobile || null,
    nicheEn: parsed.data.nicheEn || null,
    badgeLabelEn: parsed.data.badgeLabelEn || null,
    headlinePlainEn: parsed.data.headlinePlainEn || null,
    headlineEmphasisEn: parsed.data.headlineEmphasisEn || null,
    headlineSuffixEn: parsed.data.headlineSuffixEn || null,
    descriptionEn: parsed.data.descriptionEn || null,
    ctaPrimaryLabelEn: parsed.data.ctaPrimaryLabelEn || null,
    ctaSecondaryLabelEn: parsed.data.ctaSecondaryLabelEn || null,
  };
  const existing = await prisma.hero.findFirst();

  const hero = existing
    ? await prisma.hero.update({ where: { id: existing.id }, data })
    : await prisma.hero.create({ data });

  return NextResponse.json(hero);
}
