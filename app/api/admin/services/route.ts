import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const serviceSchema = z.object({
  icon: z.enum(["camera", "chat", "box", "phone"]).optional().default("camera"),
  title: z.string().min(1),
  description: z.string().min(1),
});

export async function GET() {
  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(services);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const maxOrder = await prisma.service.aggregate({ _max: { order: true } });
  const service = await prisma.service.create({
    data: { ...parsed.data, order: (maxOrder._max.order ?? -1) + 1 },
  });

  return NextResponse.json(service, { status: 201 });
}
