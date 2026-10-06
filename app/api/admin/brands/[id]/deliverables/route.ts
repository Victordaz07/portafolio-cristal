import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandCrmInclude } from "@/lib/brand-crm";
import { dateInputToDate } from "@/lib/crm";
import { deliverableCreateSchema } from "@/lib/deliverable-schemas";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

/** Agrega un entregable al trato (al final de la lista). Devuelve la marca actualizada. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = deliverableCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe qué vas a entregar", "Write what you'll deliver") }, { status: 400 });
  const brand = await prisma.brand.findUnique({ where: { id }, select: { id: true } });
  if (!brand) return NextResponse.json({ error: t("Marca no encontrada", "Brand not found") }, { status: 404 });
  const last = await prisma.deliverable.aggregate({ where: { brandId: id }, _max: { order: true } });
  await prisma.deliverable.create({
    data: {
      brandId: id,
      title: parsed.data.title,
      network: parsed.data.network ?? null,
      dueAt: parsed.data.dueAt ? dateInputToDate(parsed.data.dueAt) : null,
      order: (last._max.order ?? -1) + 1,
    },
  });
  const updated = await prisma.brand.findUnique({ where: { id }, include: brandCrmInclude });
  return NextResponse.json(updated, { status: 201 });
}
