import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/growth-schemas";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = goalSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos de la meta" }, { status: 400 });
  const { dueDate, unit, ...data } = parsed.data;
  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...data,
      ...(unit !== undefined && { unit: unit || null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(`${dueDate}T12:00:00.000Z`) : null }),
    },
  });
  return NextResponse.json(goal);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
