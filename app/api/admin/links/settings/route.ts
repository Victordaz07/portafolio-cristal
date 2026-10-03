import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { LINK_PATTERNS } from "@/lib/bio-links";

export const dynamic = "force-dynamic";

const text = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const TEXT_FIELDS = ["linksTagline", "linksTaglineEn", "linksHeroEyebrow", "linksHeroEyebrowEn", "linksHeroTitle", "linksHeroTitleEn", "linksHeroImage", "linksHeroUrl"] as const;

const schema = z.object({
  linksTagline: text(80),
  linksTaglineEn: text(80),
  linksPattern: z.enum(Object.keys(LINK_PATTERNS) as [string, ...string[]]).optional(),
  linksShowBrandKit: z.boolean().optional(),
  linksShowRecent: z.boolean().optional(),
  linksShowCopy: z.boolean().optional(),
  linksShowSocials: z.boolean().optional(),
  linksHeroShow: z.boolean().optional(),
  linksHeroEyebrow: text(24),
  linksHeroEyebrowEn: text(24),
  linksHeroTitle: text(60),
  linksHeroTitleEn: text(60),
  linksHeroImage: z.union([z.string().url(), z.string().regex(/^\/[^\s]*$/), z.literal("")]).optional(),
  linksHeroUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^(https?:\/\/|\/|mailto:)/i.test(v), "El enlace tiene que empezar con https://")
    .optional(),
});

/** Opciones de la página "link en bio": encabezado, tarjeta principal, fondo. */
export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const settings = await prisma.siteSettings.findFirst({ select: { id: true } });
  if (!settings) return NextResponse.json({ error: "Primero completa Contacto y pie" }, { status: 400 });
  const d = parsed.data;
  await prisma.siteSettings.update({
    where: { id: settings.id },
    data: {
      ...d,
      ...Object.fromEntries(TEXT_FIELDS.filter((k) => d[k] !== undefined).map((k) => [k, d[k] || null])),
    },
  });
  return NextResponse.json({ ok: true });
}
