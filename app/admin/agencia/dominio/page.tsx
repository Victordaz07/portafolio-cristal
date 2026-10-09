import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser } from "@/lib/agency";
import { creatorSiteUrl, subdomainUrl, subdomainsEnabled } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import DomainManager from "@/app/admin/(dashboard)/dominio/DomainManager";

export default async function AgencyDomainPage() {
  const agency = await agencyUser();
  if (!agency) return null;
  const record = await prismaRoot.agency.findUniqueOrThrow({ where: { id: agency.agencyId }, select: { slug: true, customDomain: true, customDomainVerifiedAt: true } });

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Agencia" title="Mi dominio" description="La dirección de tu landing y tu dominio propio." />
      {/* Una agencia no tiene la dirección provisional /s/<slug> (es solo de creadoras, ver lib/tenant.ts::currentAgencyId) */}
      <DomainManager
        officialUrl={await creatorSiteUrl(record)}
        subdomain={subdomainUrl(record.slug)}
        subdomainLive={subdomainsEnabled()}
        previewPath={subdomainUrl(record.slug)}
        apiBase="/api/admin/agency/domain"
      />
    </div>
  );
}
