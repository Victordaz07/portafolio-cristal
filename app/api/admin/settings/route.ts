import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  whyMeText: z.string().min(1),
  contactEmail: z.string().email(),
  instagramHandle: z.string().min(1),
  tiktokHandle: z.string().min(1),
  facebookHandle: z.string().optional().or(z.literal("")),
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

  const data = { ...parsed.data, facebookHandle: parsed.data.facebookHandle || null };
  const existing = await prisma.siteSettings.findFirst();

  const settings = existing
    ? await prisma.siteSettings.update({ where: { id: existing.id }, data })
    : await prisma.siteSettings.create({ data });

  return NextResponse.json(settings);
}
