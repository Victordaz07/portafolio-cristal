import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { platformOrigin } from "@/lib/site-url";
import { reportLink } from "@/lib/campaign-report-server";
import type { ReportData } from "@/lib/campaign-report";
import PageHeader from "@/components/admin/PageHeader";
import ReportEditor from "./ReportEditor";

export const dynamic = "force-dynamic";

export default async function CampaignReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const { id } = await params;
  const [report, session, origin] = await Promise.all([
    prisma.campaignReport.findUnique({ where: { id }, include: { brand: { select: { id: true, name: true, contactEmail: true, contactName: true } } } }),
    getSession(),
    platformOrigin(),
  ]);
  if (!report) notFound();
  const creator = await prismaRoot.creator.findUnique({ where: { id: report.creatorId }, select: { name: true } });

  return (
    <div className="flex flex-col gap-sp-5">
      <Link href="/admin/campanas" className="text-sm font-medium text-coral hover:underline">
        {t("← Reportes a marcas", "← Brand reports")}
      </Link>
      <PageHeader eyebrow={`${t("Reporte de campaña", "Campaign report")} · ${report.brand.name}`} title={report.title} />
      <ReportEditor
        report={{
          id: report.id,
          title: report.title,
          intro: report.intro ?? "",
          language: report.language === "en" ? "en" : "es",
          hidden: report.hidden,
          status: report.status === "sent" ? "sent" : "draft",
          sentAt: report.sentAt?.toISOString() ?? null,
          viewedAt: report.viewedAt?.toISOString() ?? null,
          data: report.data as unknown as ReportData,
        }}
        brand={{ name: report.brand.name, contactEmail: report.brand.contactEmail ?? "" }}
        creatorName={creator?.name ?? ""}
        link={reportLink(origin, report.publicToken)}
        readOnly={Boolean(session?.actorId)}
      />
    </div>
  );
}
