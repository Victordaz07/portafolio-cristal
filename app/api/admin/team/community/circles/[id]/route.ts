import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { requireRole } from "@/lib/team";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.union([
  z.object({ archived: z.boolean() }),
  z.object({ crewOnly: z.boolean() }),
  /** Nombrar o quitar a una moderadora por su @handle (el slug de la cuenta). Debe ser miembro. */
  z.object({ moderator: z.string().trim().min(1).max(60), on: z.boolean() }),
]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  if (!(await requireRole("community"))) return NextResponse.json({ error: t("Solo el equipo de Comunidad", "Community team only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { id } = await params;
  const circle = await prismaRoot.circle.findUnique({ where: { id }, select: { id: true } });
  if (!circle) return NextResponse.json({ error: t("No se encontró el círculo", "Circle not found") }, { status: 404 });
  const data = parsed.data;
  if ("archived" in data) await prismaRoot.circle.update({ where: { id }, data: { archivedAt: data.archived ? new Date() : null } });
  else if ("crewOnly" in data) await prismaRoot.circle.update({ where: { id }, data: { crewOnly: data.crewOnly } });
  else {
    const creator = await prismaRoot.creator.findUnique({ where: { slug: data.moderator.replace(/^@/, "").toLowerCase() }, select: { id: true } });
    const result = creator ? await prismaRoot.circleMember.updateMany({ where: { circleId: id, creatorId: creator.id }, data: { role: data.on ? "moderator" : "member" } }) : { count: 0 };
    if (!result.count) return NextResponse.json({ error: t("Esa persona aún no es miembro del círculo", "That person isn't a member of the circle yet") }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
