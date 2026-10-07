import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { PRODUCT_ERRORS, checkProduct, productSchema } from "@/lib/shop-schemas";
import { MAX_PRODUCTS } from "@/lib/shop";

export const dynamic = "force-dynamic";

/** Crea un producto (digital, asesoría o enlace de afiliado). Foliocrew no cobra: el enlace de pago es el tuyo. */
export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos del producto", "Check the product details") }, { status: 400 });
  const check = checkProduct(parsed.data);
  if (!check.ok) return NextResponse.json({ error: PRODUCT_ERRORS(t)[check.reason] }, { status: 400 });
  if ((await prisma.product.count()) >= MAX_PRODUCTS) return NextResponse.json({ error: t(`Puedes tener hasta ${MAX_PRODUCTS} productos`, `You can have up to ${MAX_PRODUCTS} products`) }, { status: 400 });
  const { imageUrl, ...rest } = parsed.data;
  const last = await prisma.product.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  const product = await prisma.product.create({ data: { ...rest, imageUrl: imageUrl || null, order: (last?.order ?? -1) + 1 } });
  return NextResponse.json(product, { status: 201 });
}
