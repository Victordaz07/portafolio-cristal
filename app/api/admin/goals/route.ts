import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/growth-schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = goalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos de la meta" }, { status: 400 });
  const { dueDate, ...data } = parsed.data;
  const max = await prisma.goal.aggregate({ _max: { order: true } });
  const goal = await prisma.goal.create({
    data: {
      ...data,
      unit: data.unit || null,
      dueDate: dueDate ? new Date(`${dueDate}T12:00:00.000Z`) : null,
      order: (max._max.order ?? -1) + 1,
    },
  });
  return NextResponse.json(goal, { status: 201 });
}
