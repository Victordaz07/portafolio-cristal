import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { isPlatformAdminEmail, logPlatformAction } from "@/lib/platform-admin";
import { isTeamRole, requireOwner } from "@/lib/team";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().max(80).optional(),
  roles: z.array(z.string()).min(1).max(3),
});

/** Sumar (o reactivar) a una persona del equipo. Solo el Dueño. */
export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Solo el Dueño de Foliocrew" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe un correo válido y elige al menos un rol" }, { status: 400 });
  const { email, name } = parsed.data;
  const roles = Array.from(new Set(parsed.data.roles.filter(isTeamRole)));
  if (!roles.length) return NextResponse.json({ error: "Elige al menos un rol" }, { status: 400 });
  if (isPlatformAdminEmail(email)) return NextResponse.json({ error: "Ese correo ya es Dueño de Foliocrew" }, { status: 400 });

  const member = await prismaRoot.teamMember.upsert({
    where: { email },
    create: { email, name: name || null, roles, addedBy: owner.email },
    update: { roles, active: true, ...(name ? { name } : {}) },
  });
  await logPlatformAction(owner.email, "team", null, `Equipo: ${email} → ${roles.join(", ")}`);
  return NextResponse.json({ ok: true, id: member.id });
}
