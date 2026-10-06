import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { pickLabel } from "@/lib/admin-lang";
import { formatShortDate } from "@/lib/crm";
import { CONTRACT_STATUS_META, CONTRACT_TEMPLATES, type ContractStatus } from "@/lib/contracts";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const { t, lang } = await getT();
  const contracts = await prisma.contract.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { brand: { select: { name: true } } } });
  const waiting = contracts.filter((c) => c.status === "sent").length;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Negocio", "Business")}
        title={t("Acuerdos", "Agreements")}
        description={t(
          "Un contrato simple por cada trato: lo envías con un enlace, la marca lo lee y lo acepta en línea, y los dos reciben una copia. Así tienes todo por escrito antes de empezar.",
          "A simple agreement for each deal: you send it with a link, the brand reads and accepts it online, and you both get a copy. So you have everything in writing before you start."
        )}
        action={
          <Link href="/admin/contratos/nueva" className="rounded-full bg-ink px-sp-5 py-sp-2.5 text-sm font-semibold text-cream hover:bg-coral">
            {t("+ Nuevo acuerdo", "+ New agreement")}
          </Link>
        }
      />
      {waiting > 0 && (
        <p className="rounded-[14px] bg-cobalt/10 px-sp-4 py-sp-3 text-sm text-ink">
          {waiting === 1 ? t("⏳ Hay 1 acuerdo esperando la respuesta de la marca.", "⏳ 1 agreement is waiting for the brand's reply.") : t(`⏳ Hay ${waiting} acuerdos esperando la respuesta de la marca.`, `⏳ ${waiting} agreements are waiting for the brand's reply.`)}
        </p>
      )}
      <div className="overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_1px_2px_rgba(36,18,39,0.04)]">
        {contracts.length === 0 ? (
          <p className="p-sp-5 text-sm text-ink/60">
            {t("Todavía no tienes acuerdos. Crea uno desde aquí o desde un trato en ", "No agreements yet. Create one here or from a deal in ")}
            <Link href="/admin/marcas" className="font-semibold text-coral hover:underline">
              {t("Marcas", "Brands")}
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {contracts.map((c) => {
              const status = (c.status in CONTRACT_STATUS_META ? c.status : "draft") as ContractStatus;
              const tpl = CONTRACT_TEMPLATES.find((x) => x.id === c.template);
              return (
                <li key={c.id}>
                  <Link href={`/admin/contratos/${c.id}`} className="flex flex-wrap items-center gap-x-sp-3 gap-y-1 px-sp-4 py-sp-3 hover:bg-cream/60 sm:px-sp-5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{c.brand?.name ?? t("Sin trato", "No deal")}</span>
                      <span className="block truncate text-xs text-ink/55">{tpl ? pickLabel(lang, tpl) : c.title}</span>
                    </span>
                    <span className="text-xs text-ink/50">{formatShortDate(c.acceptedAt ?? c.sentAt ?? c.createdAt, lang)}</span>
                    <span className={`rounded-full px-sp-2 py-0.5 font-mono text-[10px] uppercase ${CONTRACT_STATUS_META[status].className}`}>{pickLabel(lang, CONTRACT_STATUS_META[status])}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Card className="text-xs text-ink/55">{t("Plantilla de referencia. Foliocrew no es un despacho legal; para acuerdos grandes consulta a un abogado.", "Reference template. Foliocrew is not a law firm; for large agreements, consult a lawyer.")}</Card>
    </div>
  );
}
