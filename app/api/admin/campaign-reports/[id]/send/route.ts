import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, currentCreatorId } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { emailReportToBrand } from "@/lib/campaign-report-server";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.union([z.literal(""), z.string().trim().email().max(200)]).optional() });

/** Envía (o reenvía) el reporte a la marca por correo. Un borrador pasa a «enviado». */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const session = await getSession();
  if (session?.actorId) return NextResponse.json({ error: t("El equipo no envía reportes en nombre de una cuenta", "The team doesn't send reports on behalf of an account") }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("Correo inválido", "Invalid email") }, { status: 400 });
  const report = await prisma.campaignReport.findUnique({ where: { id }, include: { brand: { select: { name: true, contactName: true, contactEmail: true } } } });
  if (!report) return NextResponse.json({ error: t("Reporte no encontrado", "Report not found") }, { status: 404 });
  const to = parsed.data.email || report.brand.contactEmail;
  if (!to) return NextResponse.json({ error: t("Agrega el correo de la marca para enviarlo", "Add the brand's email to send it") }, { status: 400 });

  const result = await emailReportToBrand(report, to, report.brand.contactName || report.brand.name);
  const creatorId = await currentCreatorId();
  const updated = await prisma.campaignReport.update({
    where: { id },
    data: {
      status: "sent",
      sentAt: report.sentAt ?? new Date(),
      // Un BrandEvent anidado no pasa por lib/prisma.ts (tenant): lleva su creatorId.
      brand: { update: { lastContactAt: new Date(), events: { create: [{ note: lang === "en" ? `Campaign report sent: ${report.title}` : `Reporte de campaña enviado: ${report.title}`, creatorId }] } } },
    },
  });
  return NextResponse.json({ report: updated, emailed: result.sent });
}
