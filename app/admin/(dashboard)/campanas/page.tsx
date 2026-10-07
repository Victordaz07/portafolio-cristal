import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { formatShortDate } from "@/lib/crm";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

export default async function CampaignReportsPage() {
  const { t, lang } = await getT();
  const reports = await prisma.campaignReport.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { brand: { select: { name: true } } } });
  const drafts = reports.filter((r) => r.status === "draft").length;
  const badge = (r: (typeof reports)[number]) =>
    r.viewedAt
      ? { text: t("La marca lo abrió", "The brand opened it"), cls: "bg-lime/40 text-moss" }
      : r.status === "sent"
        ? { text: t("Enviado", "Sent"), cls: "bg-cobalt/15 text-cobalt-ink" }
        : { text: t("Borrador", "Draft"), cls: "bg-coral/15 text-coral" };

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Negocio", "Business")}
        title={t("Reportes a marcas", "Brand reports")}
        description={t(
          "Cuando terminas un trato, armamos un reporte con las publicaciones y sus resultados. Lo revisas, ocultas lo que no quieras mostrar y se lo envías a la marca con un enlace. Al final le preguntas: ¿repetimos?",
          "When you finish a deal, we put together a report with the posts and their results. You review it, hide anything you don't want to show and send it to the brand with a link. At the end you ask: shall we do it again?"
        )}
      />
      {drafts > 0 && (
        <p className="rounded-[14px] bg-coral/10 px-sp-4 py-sp-3 text-sm text-ink">
          {drafts === 1 ? t("📝 Tienes 1 reporte por revisar y enviar.", "📝 You have 1 report to review and send.") : t(`📝 Tienes ${drafts} reportes por revisar y enviar.`, `📝 You have ${drafts} reports to review and send.`)}
        </p>
      )}
      <div className="overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_1px_2px_rgba(36,18,39,0.04)]">
        {reports.length === 0 ? (
          <p className="p-sp-5 text-sm text-ink/60">
            {t("Todavía no tienes reportes. Se arma uno solo cuando marcas un trato como «Completado» en ", "No reports yet. One is put together automatically when you mark a deal as “Completed” in ")}
            <Link href="/admin/marcas" className="font-semibold text-coral hover:underline">
              {t("Marcas", "Brands")}
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {reports.map((r) => {
              const b = badge(r);
              return (
                <li key={r.id}>
                  <Link href={`/admin/campanas/${r.id}`} className="flex flex-wrap items-center gap-x-sp-3 gap-y-1 px-sp-4 py-sp-3 hover:bg-cream/60 sm:px-sp-5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{r.brand.name}</span>
                      <span className="block truncate text-xs text-ink/55">{r.title}</span>
                    </span>
                    <span className="text-xs text-ink/50">{formatShortDate(r.sentAt ?? r.createdAt, lang)}</span>
                    <span className={`rounded-full px-sp-2 py-0.5 font-mono text-[10px] uppercase ${b.cls}`}>{b.text}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
