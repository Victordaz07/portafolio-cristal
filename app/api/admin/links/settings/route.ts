import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { LINK_PATTERNS } from "@/lib/bio-links";

export const dynamic = "force-dynamic";

const schema = z.object({
  linksTagline: z.string().trim().max(80).optional().or(z.literal("")),
  linksTaglineEn: z.string().trim().max(80).optional().or(z.literal("")),
  linksPattern: z.enum(Object.keys(LINK_PATTERNS) as [string, ...string[]]).optional(),
  linksShowBrandKit: z.boolean().optional(),
  linksShowRecent: z.boolean().optional(),
});

/** Opciones de la página "link en bio": frase, fondo y bloques automáticos. */
export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const settings = await prisma.siteSettings.findFirst({ select: { id: true } });
  if (!settings) return NextResponse.json({ error: "Primero completa Contacto y pie" }, { status: 400 });
  const d = parsed.data;
  await prisma.siteSettings.update({
    where: { id: settings.id },
    data: {
      ...d,
      ...(d.linksTagline !== undefined ? { linksTagline: d.linksTagline || null } : {}),
      ...(d.linksTaglineEn !== undefined ? { linksTaglineEn: d.linksTaglineEn || null } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
