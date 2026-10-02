import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentCreatorId } from "@/lib/tenant";
import { brandCrmInclude } from "@/lib/brand-crm";
import { dateInputToDate } from "@/lib/crm";

export const dynamic = "force-dynamic";

const eventSchema = z.object({
  note: z.string().trim().min(1).max(500),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/** Agrega una entrada manual al historial del acuerdo y la marca como último contacto. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribe qué pasó en el acuerdo" }, { status: 400 });
  }

  const date = parsed.data.date ? dateInputToDate(parsed.data.date) : new Date();
  const existing = await prisma.brand.findUnique({ where: { id }, select: { lastContactAt: true } });
  if (!existing) {
    return NextResponse.json({ error: "Marca no encontrada" }, { status: 404 });
  }

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      events: { create: { note: parsed.data.note, date, creatorId: await currentCreatorId() } },
      lastContactAt:
        !existing.lastContactAt || existing.lastContactAt < date ? date : existing.lastContactAt,
    },
    include: brandCrmInclude,
  });
  return NextResponse.json(brand, { status: 201 });
}
