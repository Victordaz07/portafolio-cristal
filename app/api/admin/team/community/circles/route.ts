import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { requireRole } from "@/lib/team";
import { getT } from "@/lib/admin-lang-server";
import { CIRCLE_KINDS, validateCircle } from "@/lib/circles";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  nameEn: z.string().trim().max(60).nullable().optional(),
  description: z.string().trim().max(500).default(""),
  descriptionEn: z.string().trim().max(500).nullable().optional(),
  kind: z.enum(CIRCLE_KINDS.map((k) => k.id) as [string, ...string[]]),
  crewOnly: z.boolean().default(false),
});

/** El equipo de Comunidad crea un círculo. */
export async function POST(request: Request) {
  const { t } = await getT();
  if (!(await requireRole("community"))) return NextResponse.json({ error: t("Solo el equipo de Comunidad", "Community team only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa el nombre y el tipo del círculo", "Check the circle's name and type") }, { status: 400 });
  const check = validateCircle(parsed.data);
  if (!check.ok) return NextResponse.json({ error: t("Revisa el nombre (hasta 60 caracteres) y la descripción (hasta 500)", "Check the name (up to 60 characters) and description (up to 500)") }, { status: 400 });
  if (await prismaRoot.circle.findUnique({ where: { slug: check.slug } })) return NextResponse.json({ error: t("Ya existe un círculo con ese nombre", "A circle with that name already exists") }, { status: 409 });
  const circle = await prismaRoot.circle.create({ data: { ...parsed.data, nameEn: parsed.data.nameEn || null, descriptionEn: parsed.data.descriptionEn || null, slug: check.slug } });
  return NextResponse.json(circle, { status: 201 });
}
