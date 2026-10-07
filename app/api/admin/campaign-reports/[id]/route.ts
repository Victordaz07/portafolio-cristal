import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { isReportMetric, type ReportData } from "@/lib/campaign-report";
import { snapshotFor } from "@/lib/campaign-report-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  intro: z.string().trim().max(1500).nullable().optional(),
  language: z.enum(["es", "en"]).optional(),
  /** Métricas que no se muestran a la marca. */
  hidden: z.array(z.string().refine(isReportMetric)).max(10).optional(),
  /** Qué publicaciones entran (clave de la publicación → sí/no). */
  include: z.record(z.string().max(80), z.boolean()).optional(),
  /** Vuelve a leer los números actuales (conserva qué publicaciones se dejaron fuera). */
  refresh: z.boolean().optional(),
});

/** Edita el reporte: título, mensaje, idioma, métricas ocultas, publicaciones incluidas, o actualiza los números. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Datos inválidos", "Invalid data") }, { status: 400 });
  const report = await prisma.campaignReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: t("Reporte no encontrado", "Report not found") }, { status: 404 });
  const { title, intro, language, hidden, include, refresh } = parsed.data;

  let data = report.data as unknown as ReportData;
  if (refresh) data = await snapshotFor(report.brandId, data);
  if (include) data = { ...data, posts: data.posts.map((p) => (p.key in include ? { ...p, include: include[p.key] } : p)) };

  const updated = await prisma.campaignReport.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(intro !== undefined ? { intro: intro || null } : {}),
      ...(language ? { language } : {}),
      ...(hidden ? { hidden: Array.from(new Set(hidden)) } : {}),
      ...(refresh || include ? { data: data as object } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const result = await prisma.campaignReport.deleteMany({ where: { id } });
  if (!result.count) return NextResponse.json({ error: t("Reporte no encontrado", "Report not found") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
