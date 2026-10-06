import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { pickLabel } from "@/lib/admin-lang";
import { formatShortDate } from "@/lib/crm";
import { CONTRACT_STATUS_META, isContractTemplate, type ContractParties, type ContractStatus, type ContractTerms } from "@/lib/contracts";
import { contractLink } from "@/lib/contracts-server";
import { platformOrigin } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import ContractDocument from "@/components/contract/ContractDocument";
import ContractEditor from "../ContractEditor";
import ContractAdminActions from "./ContractAdminActions";

export const dynamic = "force-dynamic";

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const { id } = await params;
  const [contract, session, origin] = await Promise.all([prisma.contract.findUnique({ where: { id }, include: { brand: { select: { id: true, name: true } } } }), getSession(), platformOrigin()]);
  if (!contract) notFound();
  const status = (contract.status in CONTRACT_STATUS_META ? contract.status : "draft") as ContractStatus;
  const parties = contract.parties as unknown as ContractParties;
  const terms = contract.terms as unknown as ContractTerms;
  const readOnly = Boolean(session?.actorId);
  const brands = status === "draft" ? await prisma.brand.findMany({ where: { dealStatus: { not: null } }, orderBy: { name: "asc" }, select: { id: true, name: true } }) : [];

  const timeline = [
    { at: contract.createdAt, text: t("Creado", "Created") },
    contract.sentAt && { at: contract.sentAt, text: t("Enviado a la marca", "Sent to the brand") },
    contract.viewedAt && { at: contract.viewedAt, text: t("La marca lo abrió", "The brand opened it") },
    contract.declinedAt && { at: contract.declinedAt, text: t("La marca pidió cambios", "The brand asked for changes") },
    contract.acceptedAt && { at: contract.acceptedAt, text: t(`Aceptado por ${contract.acceptedName} 🎉`, `Accepted by ${contract.acceptedName} 🎉`) },
  ].filter((x): x is { at: Date; text: string } => Boolean(x));

  return (
    <div className="flex flex-col gap-sp-5">
      <Link href="/admin/contratos" className="text-sm font-medium text-coral hover:underline">
        {t("← Acuerdos", "← Agreements")}
      </Link>
      <PageHeader
        eyebrow={contract.brand ? `${t("Acuerdo", "Agreement")} · ${contract.brand.name}` : t("Acuerdo", "Agreement")}
        title={contract.title}
        action={<span className={`rounded-full px-sp-3 py-1 font-mono text-[11px] uppercase ${CONTRACT_STATUS_META[status].className}`}>{pickLabel(lang, CONTRACT_STATUS_META[status])}</span>}
      />

      {status === "declined" && (
        <div className="rounded-[14px] bg-coral/10 px-sp-4 py-sp-3 text-sm text-ink">
          <p className="font-semibold">{t("La marca pidió cambios", "The brand asked for changes")}</p>
          {contract.declineReason && <p className="mt-1 whitespace-pre-line text-ink/80">“{contract.declineReason}”</p>}
        </div>
      )}
      {status === "accepted" && (
        <p className="rounded-[14px] bg-lime/30 px-sp-4 py-sp-3 text-sm font-semibold text-moss">
          {t("🎉 Aceptado. El trato quedó activo y los dos recibieron una copia por correo. Este texto ya no se puede cambiar.", "🎉 Accepted. The deal is now active and you both got a copy by email. This text can no longer be changed.")}
        </p>
      )}

      <ContractAdminActions id={contract.id} status={status} link={contractLink(origin, contract.publicToken)} hasEmail={Boolean(parties.brand?.email)} readOnly={readOnly} />

      {status === "draft" && !readOnly && isContractTemplate(terms.template) ? (
        <Card>
          <ContractEditor
            contractId={contract.id}
            brands={brands}
            initial={{ brandId: contract.brandId ?? "", language: contract.language === "en" ? "en" : "es", terms, parties }}
          />
        </Card>
      ) : (
        <div className="grid gap-sp-5 lg:grid-cols-[1fr_260px]">
          <ContractDocument
            bodyText={contract.bodyText}
            language={contract.language}
            status={status}
            acceptance={
              contract.acceptedAt ? { name: contract.acceptedName ?? "", email: contract.acceptedEmail ?? "", at: contract.acceptedAt, ip: contract.acceptedIp, hash: contract.bodyHash } : null
            }
          />
          <Card className="h-fit">
            <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Historial", "History")}</p>
            <ul className="flex flex-col gap-sp-2 text-sm">
              {timeline.map((e) => (
                <li key={e.text} className="flex gap-sp-2">
                  <span className="w-14 shrink-0 font-mono text-[11px] text-ink/50">{formatShortDate(e.at, lang)}</span>
                  <span className="text-ink/80">{e.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
