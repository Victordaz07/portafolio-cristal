import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { creatorSiteUrl, sitePreviewPath, subdomainUrl, subdomainsEnabled } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import DomainManager from "./DomainManager";

export default async function DomainPage() {
  const session = await getSession();
  const creator = session
    ? await prismaRoot.creator.findUnique({
        where: { id: session.creatorId },
        select: { slug: true, customDomain: true, customDomainVerifiedAt: true },
      })
    : null;
  if (!creator) return null;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow="Landing"
        title="Mi dominio"
        description="La dirección de tu sitio y tu dominio propio (por ejemplo, tunombre.com)."
      />
      <DomainManager
        officialUrl={await creatorSiteUrl(creator)}
        subdomain={subdomainUrl(creator.slug)}
        subdomainLive={subdomainsEnabled()}
        previewPath={sitePreviewPath(creator.slug)}
      />
    </div>
  );
}
