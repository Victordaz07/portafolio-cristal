import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const pricingPackageUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  deliverables: z.array(z.string().min(1)).optional(),
  featured: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = pricingPackageUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const pkg = await prisma.pricingPackage.update({ where: { id }, data: parsed.data });
  return NextResponse.json(pkg);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.pricingPackage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
