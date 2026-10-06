import { NextResponse } from "next/server";
import { z } from "zod";
import { savePitch } from "@/lib/pitch-server";
import { httpUrl } from "@/lib/validators";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  brandId: z.string().min(1).optional(),
  brandName: z.string().trim().min(1).max(100),
  websiteUrl: z.union([z.literal(""), httpUrl().max(300)]).optional(),
  contactName: z.string().trim().max(100).optional(),
  contactEmail: z.union([z.literal(""), z.string().trim().email().max(200)]).optional(),
  offer: z.string().trim().min(3).max(1000),
  subject: z.string().trim().min(1).max(200),
  lang: z.enum(["es", "en"]).default("es"),
});

/** «Guardar en el CRM»: la marca queda como prospecto y el seguimiento cuenta desde hoy. */
export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const brand = await savePitch(parsed.data);
  if (!brand) return NextResponse.json({ error: t("Marca no encontrada", "Brand not found") }, { status: 404 });
  return NextResponse.json(brand, { status: parsed.data.brandId ? 200 : 201 });
}
