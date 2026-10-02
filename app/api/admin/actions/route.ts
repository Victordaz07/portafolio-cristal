import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actionSchema } from "@/lib/growth-schemas";
import { weekStartOf } from "@/lib/growth";
import { todayKey } from "@/lib/growth-server";

export const dynamic = "force-dynamic";

/** Agrega una tarea al plan de la semana actual. */
export async function POST(request: Request) {
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe la tarea" }, { status: 400 });
  const weekStart = weekStartOf(todayKey());
  const max = await prisma.actionItem.aggregate({ where: { weekStart }, _max: { order: true } });
  const item = await prisma.actionItem.create({
    data: {
      label: parsed.data.label,
      category: parsed.data.category,
      weekStart,
      order: (max._max.order ?? -1) + 1,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
