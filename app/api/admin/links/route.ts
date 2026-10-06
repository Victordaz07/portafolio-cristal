import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_LINKS, OPTIONAL_TEXT, linkSchema } from "@/lib/bio-links";
import { getT } from "@/lib/admin-lang-server";
import { validationMessage } from "@/lib/admin-lang";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await prisma.bioLink.findMany({ orderBy: { order: "asc" } }));
}

export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = linkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: validationMessage(t, parsed.error.issues[0]?.message) }, { status: 400 });
  if ((await prisma.bioLink.count()) >= MAX_LINKS) return NextResponse.json({ error: t(`Máximo ${MAX_LINKS} enlaces`, `Up to ${MAX_LINKS} links`) }, { status: 400 });
  const d = parsed.data;
  // El grupo tiene que ser un grupo propio de esta cuenta (el filtro por cuenta lo pone lib/prisma.ts).
  const group = d.groupId ? await prisma.bioLinkGroup.findFirst({ where: { id: d.groupId, kind: "custom" }, select: { id: true } }) : null;
  if (d.groupId && !group) return NextResponse.json({ error: t("Ese grupo no existe", "That group doesn't exist") }, { status: 400 });
  const max = await prisma.bioLink.aggregate({ where: { groupId: group?.id ?? null }, _max: { order: true } });
  const link = await prisma.bioLink.create({
    data: {
      title: d.title,
      url: d.url,
      wide: d.wide,
      hidden: d.hidden ?? false,
      section: d.section ?? "",
      groupId: group?.id ?? null,
      ...Object.fromEntries(OPTIONAL_TEXT.map((k) => [k, d[k] || null])),
      order: (max._max.order ?? -1) + 1,
    },
  });
  return NextResponse.json(link, { status: 201 });
}
