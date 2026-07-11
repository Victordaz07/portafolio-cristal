import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const pricingPackageSchema = z.object({
  name: z.string().min(1),
  price: z.string().min(1),
  unit: z.string().min(1),
  deliverables: z.array(z.string().min(1)),
  featured: z.boolean().optional(),
});

export async function GET() {
  const packages = await prisma.pricingPackage.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(packages);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = pricingPackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const maxOrder = await prisma.pricingPackage.aggregate({ _max: { order: true } });
  const pkg = await prisma.pricingPackage.create({
    data: {
      ...parsed.data,
      featured: parsed.data.featured ?? false,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(pkg, { status: 201 });
}
