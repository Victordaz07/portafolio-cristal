import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const packageSchema = z.object({
  emoji: z.string().min(1).optional().default("✨"),
  name: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
});

export async function GET() {
  const packages = await prisma.package.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(packages);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = packageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const maxOrder = await prisma.package.aggregate({ _max: { order: true } });
  const pkg = await prisma.package.create({
    data: { ...parsed.data, order: (maxOrder._max.order ?? -1) + 1 },
  });

  return NextResponse.json(pkg, { status: 201 });
}
