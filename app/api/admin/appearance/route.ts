import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ACCENTS } from "@/lib/theme";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  // Acepta URLs absolutas (Blob) o rutas del propio sitio como "/images/foto.png".
  photoUrl: z.union([z.string().url(), z.string().regex(/^\/[^\s]*$/), z.literal("")]).nullable(),
  description: z.string().trim().max(1000),
  descriptionEn: z.string().trim().max(1000),
  accentColor: z.enum(Object.keys(ACCENTS) as [string, ...string[]]),
});

/** Guarda el perfil público (nombre, foto, bio) y el color de acento del sitio. */
export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa el nombre y la foto" }, { status: 400 });
  const { accentColor, ...profile } = parsed.data;

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
        name: profile.name,
        photoUrl: profile.photoUrl || null,
        description: profile.description,
        descriptionEn: profile.descriptionEn || null,
      },
    }),
    prisma.siteSettings.update({ where: { id: settings.id }, data: { accentColor } }),
  ]);
  return NextResponse.json({ ok: true });
}
