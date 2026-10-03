import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ACCENTS } from "@/lib/theme";
import { BACKGROUNDS, CORNERS, FONTS, HEROES, SECTION_IDS, STYLES, normalizeSections } from "@/lib/design";
import { LINK_PATTERNS } from "@/lib/bio-links";

export const dynamic = "force-dynamic";

const keys = <T extends object>(obj: T) => Object.keys(obj) as [string, ...string[]];

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  // Acepta URLs absolutas (Blob) o rutas del propio sitio como "/images/foto.png".
  photoUrl: z.union([z.string().url(), z.string().regex(/^\/[^\s]*$/), z.literal("")]).nullable(),
  description: z.string().trim().max(1000),
  descriptionEn: z.string().trim().max(1000),
  accentColor: z.enum([...keys(ACCENTS), "custom"]),
  // Estudio de diseño (opcional para formularios viejos): solo opciones válidas de lib/design.ts.
  customAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  style: z.enum(keys(STYLES)).optional(),
  font: z.enum(keys(FONTS)).optional(),
  corners: z.enum(keys(CORNERS)).optional(),
  background: z.enum(keys(BACKGROUNDS)).optional(),
  hero: z.enum(keys(HEROES)).optional(),
  pattern: z.enum(keys(LINK_PATTERNS)).optional(),
  sections: z
    .array(z.object({ id: z.enum(SECTION_IDS as [string, ...string[]]), hidden: z.boolean() }))
    .max(SECTION_IDS.length)
    .optional(),
});

/** Guarda el perfil público (nombre, foto, bio) y el diseño del sitio (Estudio de diseño). */
export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa el nombre, la foto y las opciones de diseño" }, { status: 400 });
  const d = parsed.data;
  if (d.accentColor === "custom" && !d.customAccent) return NextResponse.json({ error: "Elige tu color propio" }, { status: 400 });

  const [hero, settings] = await Promise.all([
    prisma.hero.findFirst({ select: { id: true } }),
    prisma.siteSettings.findFirst({ select: { id: true } }),
  ]);
  if (!hero || !settings) {
    return NextResponse.json({ error: "Primero completa la Portada (Hero) y Contacto y pie" }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.hero.update({
      where: { id: hero.id },
      data: {
        name: d.name,
        photoUrl: d.photoUrl || null,
        description: d.description,
        descriptionEn: d.descriptionEn || null,
      },
    }),
    prisma.siteSettings.update({
      where: { id: settings.id },
      data: {
        accentColor: d.accentColor,
        ...(d.customAccent !== undefined ? { customAccent: d.customAccent?.toUpperCase() ?? null } : {}),
        ...(d.style ? { themeStyle: d.style } : {}),
        ...(d.font ? { fontPair: d.font } : {}),
        ...(d.corners ? { corners: d.corners } : {}),
        ...(d.background ? { background: d.background } : {}),
        ...(d.hero ? { heroLayout: d.hero } : {}),
        ...(d.pattern ? { linksPattern: d.pattern } : {}),
        ...(d.sections ? { sectionLayout: normalizeSections(d.sections) as unknown as Prisma.InputJsonValue } : {}),
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
