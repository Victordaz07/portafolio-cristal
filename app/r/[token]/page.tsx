import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { creatorSiteUrl } from "@/lib/site-url";
import { tooManyAttempts } from "@/lib/rate-limit";
import { publicReport, type ReportData } from "@/lib/campaign-report";
import { notifyCreatorReportViewed } from "@/lib/campaign-report-server";
import ReportDocument from "@/components/campaign/ReportDocument";
import ReportPrintBar from "@/components/campaign/ReportPrintBar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reporte de campaña · Campaign report",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Página pública del reporte de campaña: la abre la marca con el enlace del correo (sin iniciar sesión). */
export default async function PublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) notFound();
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (tooManyAttempts(`report-page:${ip}`, 60, 60_000)) notFound();

  const report = await prismaRoot.campaignReport.findUnique({
    where: { publicToken: token },
    include: { brand: { select: { name: true } }, creator: { select: { name: true, slug: true, customDomain: true, customDomainVerifiedAt: true } } },
  });
  if (!report) notFound();
  const session = await getSession();
  const isOwner = session?.creatorId === report.creatorId;
  // Un borrador solo lo ve su creadora (vista previa).
  if (report.status === "draft" && !isOwner) notFound();

  // La primera vez que lo abre alguien que no es la creadora: queda «visto» y se le avisa.
  if (!isOwner && report.status === "sent" && !report.viewedAt) {
    const marked = await prismaRoot.campaignReport.updateMany({ where: { id: report.id, viewedAt: null }, data: { viewedAt: new Date() } });
    if (marked.count) await notifyCreatorReportViewed(report, report.brand.name);
  }

  const lang = report.language === "en" ? "en" : "es";
  const view = publicReport(report.data as unknown as ReportData, report.hidden);
  const repeatUrl = `${await creatorSiteUrl(report.creator)}/#paquetes`;

  return (
    <main className="min-h-screen bg-cream px-sp-4 py-sp-6 sm:py-sp-10 print:bg-white print:p-0">
      {isOwner && report.status === "draft" && (
        <p className="mx-auto mb-sp-4 max-w-3xl rounded-[12px] bg-coral/10 px-sp-4 py-sp-2 text-sm text-ink print:hidden">
          {lang === "en" ? "Preview: this report is still a draft. The brand can't see it until you send it." : "Vista previa: este reporte todavía es un borrador. La marca no lo ve hasta que lo envíes."}
        </p>
      )}
      <ReportPrintBar lang={lang} />
      <ReportDocument lang={lang} title={report.title} intro={report.intro} brandName={report.brand.name} creatorName={report.creator.name} report={view} repeatUrl={repeatUrl} />
    </main>
  );
}
