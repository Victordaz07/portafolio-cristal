import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { logPlatformAction } from "@/lib/platform-admin";
import { isTeamRole, requireOwner } from "@/lib/team";

export const dynamic = "force-dynamic";

const schema = z.object({
  roles: z.array(z.string()).max(3).optional(),
  active: z.boolean().optional(),
  name: z.string().trim().max(80).optional(),
});

/** Cambiar roles, nombre o pausar el acceso de alguien del equipo. Solo el Dueño. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Solo el Dueño de Foliocrew" }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const roles = parsed.data.roles ? Array.from(new Set(parsed.data.roles.filter(isTeamRole))) : undefined;
  if (roles && !roles.length) return NextResponse.json({ error: "Deja al menos un rol (o quita a la persona)" }, { status: 400 });
  const member = await prismaRoot.teamMember
    .update({
      where: { id },
      data: { ...(roles ? { roles } : {}), ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}), ...(parsed.data.name !== undefined ? { name: parsed.data.name || null } : {}) },
    })
    .catch(() => null);
  if (!member) return NextResponse.json({ error: "No encontré a esa persona" }, { status: 404 });
  await logPlatformAction(owner.email, "team", null, `Equipo: ${member.email} → ${member.active ? member.roles.join(", ") : "acceso pausado"}`);
  return NextResponse.json({ ok: true });
}

/** Quitar a alguien del equipo (su cuenta de Foliocrew sigue igual). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Solo el Dueño de Foliocrew" }, { status: 403 });
  const { id } = await params;
  const member = await prismaRoot.teamMember.delete({ where: { id } }).catch(() => null);
  if (!member) return NextResponse.json({ error: "No encontré a esa persona" }, { status: 404 });
  await logPlatformAction(owner.email, "team", null, `Equipo: ${member.email} quitado`);
  return NextResponse.json({ ok: true });
}
