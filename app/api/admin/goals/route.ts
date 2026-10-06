import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/growth-schemas";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = goalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos de la meta", "Check the goal details") }, { status: 400 });
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
