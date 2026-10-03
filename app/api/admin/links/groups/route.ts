import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groupSchema } from "@/lib/bio-links";

export const dynamic = "force-dynamic";

const MAX_GROUPS = 12;

/** Nuevo grupo propio en el link en bio (va al final; se mueve en el editor). */
export async function POST(request: Request) {
  const parsed = groupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  if ((await prisma.bioLinkGroup.count({ where: { kind: "custom" } })) >= MAX_GROUPS) {
    return NextResponse.json({ error: `Máximo ${MAX_GROUPS} grupos` }, { status: 400 });
  }
  const max = await prisma.bioLinkGroup.aggregate({ _max: { order: true } });
  const group = await prisma.bioLinkGroup.create({
    data: { kind: "custom", title: parsed.data.title, titleEn: parsed.data.titleEn || null, order: (max._max.order ?? -1) + 1 },
  });
  return NextResponse.json({ ...group, links: [] }, { status: 201 });
}
