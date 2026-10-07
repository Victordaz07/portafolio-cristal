import { NextResponse } from "next/server";
import { z } from "zod";
import { getT } from "@/lib/admin-lang-server";
import { createReportDraft } from "@/lib/campaign-report-server";

export const dynamic = "force-dynamic";

const schema = z.object({ brandId: z.string().min(1).max(60), language: z.enum(["es", "en"]).optional() });

/** Crea el reporte de campaña de una marca en borrador (si ya hay un borrador, devuelve ese). */
export async function POST(request: Request) {
  const { t, lang } = await getT();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const result = await createReportDraft(parsed.data.brandId, parsed.data.language ?? lang);
  if (!result) return NextResponse.json({ error: t("Marca no encontrada", "Brand not found") }, { status: 404 });
  return NextResponse.json(result.report, { status: result.created ? 201 : 200 });
}
