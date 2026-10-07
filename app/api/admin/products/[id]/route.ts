import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { PRODUCT_ERRORS, checkProduct, productSchema } from "@/lib/shop-schemas";

export const dynamic = "force-dynamic";

/** Edita un producto (se manda completo) o solo lo muestra/oculta con { active }. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body && Object.keys(body).length === 1 && typeof body.active === "boolean") {
    const result = await prisma.product.updateMany({ where: { id }, data: { active: body.active } });
    if (!result.count) return NextResponse.json({ error: t("No se encontró el producto", "Product not found") }, { status: 404 });
    return NextResponse.json({ ok: true });
  }
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos del producto", "Check the product details") }, { status: 400 });
  const check = checkProduct(parsed.data);
  if (!check.ok) return NextResponse.json({ error: PRODUCT_ERRORS(t)[check.reason] }, { status: 400 });
  const { imageUrl, ...rest } = parsed.data;
  const result = await prisma.product.updateMany({ where: { id }, data: { ...rest, imageUrl: imageUrl || null } });
  if (!result.count) return NextResponse.json({ error: t("No se encontró el producto", "Product not found") }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const result = await prisma.product.deleteMany({ where: { id } });
  if (!result.count) return NextResponse.json({ error: t("No se encontró el producto", "Product not found") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
