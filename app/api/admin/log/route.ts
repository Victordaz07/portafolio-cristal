import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSchema } from "@/lib/growth-schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = logSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe al menos un título y la fecha" }, { status: 400 });
  const entry = await prisma.logEntry.create({ data: parsed.data });
  return NextResponse.json(entry, { status: 201 });
}
