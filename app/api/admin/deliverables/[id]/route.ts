import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { brandCrmInclude } from "@/lib/brand-crm";
import { dateInputToDate } from "@/lib/crm";
import { deliverableUpdateSchema } from "@/lib/deliverable-schemas";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const brandOf = (brandId: string) => prisma.brand.findUnique({ where: { id: brandId }, include: brandCrmInclude });

/** Cambia un entregable (estado, fecha, enlace, título) o lo mueve en la lista. Devuelve la marca actualizada. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = deliverableUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const current = await prisma.deliverable.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: t("Entregable no encontrado", "Deliverable not found") }, { status: 404 });

  const { move, dueAt, proofUrl, ...rest } = parsed.data;
  if (move) {
    const siblings = await prisma.deliverable.findMany({ where: { brandId: current.brandId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true } });
    const i = siblings.findIndex((s) => s.id === id);
    const j = move === "up" ? i - 1 : i + 1;
    if (j >= 0 && j < siblings.length) {
      const ids = siblings.map((s) => s.id);
      [ids[i], ids[j]] = [ids[j], ids[i]];
      await prisma.$transaction(ids.map((sid, order) => prisma.deliverable.update({ where: { id: sid }, data: { order } })));
    }
    return NextResponse.json(await brandOf(current.brandId));
  }

  const data: Prisma.DeliverableUncheckedUpdateInput = { ...rest };
  if (proofUrl !== undefined) data.proofUrl = proofUrl || null;
  if (dueAt !== undefined) {
    data.dueAt = dueAt ? dateInputToDate(dueAt) : null;
    // Fecha nueva: se puede volver a avisar.
    data.remindedAt = null;
  }
  await prisma.deliverable.update({ where: { id }, data });
  return NextResponse.json(await brandOf(current.brandId));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const current = await prisma.deliverable.findUnique({ where: { id }, select: { brandId: true } });
  if (!current) return NextResponse.json({ error: t("Entregable no encontrado", "Deliverable not found") }, { status: 404 });
  await prisma.deliverable.delete({ where: { id } });
  return NextResponse.json(await brandOf(current.brandId));
}
