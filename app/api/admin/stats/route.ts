import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  icon: z.enum(["heart", "star", "chat"]).optional().default("star"),
});

export async function GET() {
  const stats = await prisma.stat.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(stats);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = statSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const maxOrder = await prisma.stat.aggregate({ _max: { order: true } });
  const stat = await prisma.stat.create({
    data: { ...parsed.data, order: (maxOrder._max.order ?? -1) + 1 },
  });

  return NextResponse.json(stat, { status: 201 });
}
