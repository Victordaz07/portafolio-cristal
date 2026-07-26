import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  whyMeText: z.string().min(1),
  whyMeTextEn: z.string().optional().or(z.literal("")),
  contactEmail: z.string().email(),
  instagramHandle: z.string().min(1),
  tiktokHandle: z.string().min(1),
  facebookHandle: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  collabsEmail: z.string().email().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  youtubeHandle: z.string().optional().or(z.literal("")),
  pinterestHandle: z.string().optional().or(z.literal("")),
  footerIntro: z.string().optional().or(z.literal("")),
  footerIntroEn: z.string().optional().or(z.literal("")),
  supportMessage: z.string().optional().or(z.literal("")),
  supportMessageEn: z.string().optional().or(z.literal("")),
});

export async function GET() {
  const settings = await prisma.siteSettings.findFirst();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = {
    ...parsed.data,
    facebookHandle: parsed.data.facebookHandle || null,
    whatsapp: parsed.data.whatsapp || null,
    collabsEmail: parsed.data.collabsEmail || null,
    websiteUrl: parsed.data.websiteUrl || null,
    youtubeHandle: parsed.data.youtubeHandle || null,
    pinterestHandle: parsed.data.pinterestHandle || null,
    footerIntro: parsed.data.footerIntro || null,
    supportMessage: parsed.data.supportMessage || null,
    whyMeTextEn: parsed.data.whyMeTextEn || null,
    footerIntroEn: parsed.data.footerIntroEn || null,
    supportMessageEn: parsed.data.supportMessageEn || null,
  };
  const existing = await prisma.siteSettings.findFirst();

  const settings = existing
    ? await prisma.siteSettings.update({ where: { id: existing.id }, data })
    : await prisma.siteSettings.create({ data });

  return NextResponse.json(settings);
}
