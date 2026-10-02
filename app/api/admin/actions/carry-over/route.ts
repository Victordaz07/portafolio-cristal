import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { weekStartOf } from "@/lib/growth";
import { todayKey } from "@/lib/growth-server";

export const dynamic = "force-dynamic";

/** Mueve a la semana actual las tareas sin terminar de semanas anteriores. */
export async function POST() {
  const weekStart = weekStartOf(todayKey());
  const result = await prisma.actionItem.updateMany({
    where: { done: false, weekStart: { lt: weekStart } },
    data: { weekStart },
  });
  return NextResponse.json({ moved: result.count });
}
