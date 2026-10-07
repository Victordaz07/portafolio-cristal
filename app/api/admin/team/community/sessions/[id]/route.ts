import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { requireRole } from "@/lib/team";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({ canceled: z.boolean() });

/** Cancela (o reactiva) una sesión. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  if (!(await requireRole("community"))) return NextResponse.json({ error: t("Solo el equipo de Comunidad", "Community team only") }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const { id } = await params;
  const result = await prismaRoot.liveSession.updateMany({ where: { id }, data: { canceledAt: parsed.data.canceled ? new Date() : null } });
  if (!result.count) return NextResponse.json({ error: t("No se encontró la sesión", "Session not found") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
