import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { creatorSiteUrl, sitePreviewPath, subdomainUrl, subdomainsEnabled } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import DomainManager from "./DomainManager";
import { getT } from "@/lib/admin-lang-server";

export default async function DomainPage() {
  const { t } = await getT();
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
        eyebrow={t("Landing", "Landing page")}
        title={t("Mi dominio", "My domain")}
        description={t("La dirección de tu sitio y tu dominio propio (por ejemplo, tunombre.com).", "Your site address and your own domain (for example, yourname.com).")}
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
