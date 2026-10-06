import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { pickLabel } from "@/lib/admin-lang";
import { CONTRACT_TEMPLATES, emptyTerms, isContractTemplate } from "@/lib/contracts";
import { getBillingProfile } from "@/lib/invoices-server";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import ContractEditor from "../ContractEditor";

export const dynamic = "force-dynamic";

/** Nuevo acuerdo. Primero se elige la plantilla; con ?marca=<id> se llena con los datos del trato. */
export default async function NewContractPage({ searchParams }: { searchParams: Promise<{ marca?: string; plantilla?: string }> }) {
  const { t, lang } = await getT();
  const sp = await searchParams;
  const brandQuery = sp.marca ? `&marca=${encodeURIComponent(sp.marca)}` : "";
  const back = (
    <Link href="/admin/contratos" className="text-sm font-medium text-coral hover:underline">
      {t("← Acuerdos", "← Agreements")}
    </Link>
  );

  if (!isContractTemplate(sp.plantilla)) {
    return (
      <div className="flex flex-col gap-sp-5">
        {back}
        <PageHeader
          eyebrow={t("Acuerdos", "Agreements")}
          title={t("Nuevo acuerdo", "New agreement")}
          description={t("Elige la plantilla que más se parece a tu trato. Después ajustas los detalles y ves cómo queda.", "Pick the template closest to your deal. Then adjust the details and see how it looks.")}
        />
        <div className="grid gap-sp-3 sm:grid-cols-2">
          {CONTRACT_TEMPLATES.map((x) => (
            <Link key={x.id} href={`/admin/contratos/nueva?plantilla=${x.id}${brandQuery}`} className="group">
              <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-coral/40">
                <p className="font-fraunces text-xl font-semibold text-ink group-hover:text-coral">{pickLabel(lang, x)}</p>
                <p className="mt-1 text-sm text-ink/65">{lang === "en" ? x.hintEn : x.hint}</p>
              </Card>
            </Link>
          ))}
        </div>
        <p className="text-xs text-ink/50">{t("Plantilla de referencia. Foliocrew no es un despacho legal; para acuerdos grandes consulta a un abogado.", "Reference template. Foliocrew is not a law firm; for large agreements, consult a lawyer.")}</p>
      </div>
    );
  }

  const [profile, brands, brand] = await Promise.all([
    getBillingProfile(),
    prisma.brand.findMany({ where: { dealStatus: { not: null } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    sp.marca
      ? prisma.brand.findUnique({
          where: { id: sp.marca },
          select: {
            id: true,
            name: true,
            contactName: true,
            contactEmail: true,
            dealValue: true,
            packageDetail: true,
            usageRightsDays: true,
            exclusivityDays: true,
            exclusivityCategory: true,
            whitelisting: true,
            deliverables: { orderBy: { order: "asc" }, select: { title: true } },
          },
        })
      : null,
  ]);

  const terms = emptyTerms(sp.plantilla);
  terms.depositPercent = terms.depositPercent > 0 ? profile.depositPercent : 0;
  terms.paymentDays = profile.termsDays;
  if (brand) {
    terms.fee = (brand.dealValue ?? 0) * 100;
    terms.deliverables = brand.deliverables.length ? brand.deliverables.map((d) => d.title) : brand.packageDetail?.trim() ? [brand.packageDetail.trim()] : [];
    if (brand.usageRightsDays) terms.usageDays = brand.usageRightsDays;
    if (brand.exclusivityDays) terms.exclusivityDays = brand.exclusivityDays;
    terms.exclusivityCategory = brand.exclusivityCategory ?? "";
    terms.whitelisting = brand.whitelisting;
  }

  return (
    <div className="flex flex-col gap-sp-5">
      {back}
      <PageHeader
        eyebrow={t("Acuerdos", "Agreements")}
        title={`${t("Nuevo acuerdo", "New agreement")} · ${pickLabel(lang, CONTRACT_TEMPLATES.find((x) => x.id === sp.plantilla)!)}`}
        description={t("Llena los huecos y mira a la derecha cómo queda el texto. Se guarda como borrador hasta que lo envíes.", "Fill in the blanks and see the text on the right. It's saved as a draft until you send it.")}
      />
      <ContractEditor
        brands={brands}
        initial={{
          brandId: brand?.id ?? "",
          language: lang,
          terms,
          parties: {
            creator: { name: profile.legalName, location: profile.location, email: profile.email },
            brand: { company: brand?.name ?? "", name: brand?.contactName ?? "", email: brand?.contactEmail ?? "" },
          },
        }}
      />
    </div>
  );
}
