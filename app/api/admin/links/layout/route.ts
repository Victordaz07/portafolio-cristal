import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  groups: z
    .array(z.object({ id: z.string().min(1).max(40), links: z.array(z.string().min(1).max(40)).max(60) }))
    .max(30),
});

/**
 * Orden completo de la página: los bloques y los enlaces dentro de cada grupo (mover, arrastrar, cambiar de grupo).
 * Solo se aceptan ids de esta cuenta, y los enlaces solo pueden ir en grupos propios.
 */
export async function PUT(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [groups, links] = await Promise.all([
    prisma.bioLinkGroup.findMany({ select: { id: true, kind: true } }),
    prisma.bioLink.findMany({ select: { id: true } }),
  ]);
  const groupKind = new Map(groups.map((g) => [g.id, g.kind]));
  const linkIds = new Set(links.map((l) => l.id));
  const seen = new Set<string>();
  for (const g of parsed.data.groups) {
    if (!groupKind.has(g.id)) return NextResponse.json({ error: "Hay un bloque que no existe" }, { status: 400 });
    if (g.links.length && groupKind.get(g.id) !== "custom") return NextResponse.json({ error: "Los enlaces van en tus grupos" }, { status: 400 });
    for (const id of g.links) {
      if (!linkIds.has(id) || seen.has(id)) return NextResponse.json({ error: "Hay un enlace que no existe" }, { status: 400 });
      seen.add(id);
    }
  }
  await prisma.$transaction([
    ...parsed.data.groups.map((g, order) => prisma.bioLinkGroup.update({ where: { id: g.id }, data: { order } })),
    ...parsed.data.groups.flatMap((g) => g.links.map((id, order) => prisma.bioLink.update({ where: { id }, data: { order, groupId: g.id } }))),
  ]);
  return NextResponse.json({ ok: true });
}
