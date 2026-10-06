import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { contractFieldsSchema } from "@/lib/contract-schemas";
import { createContract } from "@/lib/contracts-server";

export const dynamic = "force-dynamic";

/** Crea un contrato en borrador (el texto se genera aquí, a partir de los huecos). */
export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = contractFieldsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos del contrato", "Check the agreement details") }, { status: 400 });
  if (parsed.data.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: parsed.data.brandId }, select: { id: true } });
    if (!brand) return NextResponse.json({ error: t("Marca no encontrada", "Brand not found") }, { status: 404 });
  }
  const contract = await createContract(parsed.data);
  return NextResponse.json(contract, { status: 201 });
}
