import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { sessionCreatorSite } from "@/lib/site-url";
import LinksManager from "./LinksManager";
import { isLinkPattern } from "@/lib/bio-links";

export default async function AdminLinksPage() {
  const [links, site, settings] = await Promise.all([
    prisma.bioLink.findMany({ orderBy: { order: "asc" } }),
    sessionCreatorSite(),
    prisma.siteSettings.findFirst({ select: { linksTagline: true, linksTaglineEn: true, linksPattern: true, linksShowBrandKit: true, linksShowRecent: true } }),
  ]);
  const base = (site?.url ?? "").replace(/\/$/, "");

  return (
    <div>
      <PageHeader
        eyebrow="Landing"
        title="Link en bio"
        description="Tu página para la bio de Instagram y TikTok: tus marcas, favoritos, cupones y PayPal en grupos, con clics contados. Usa el color y la tipografía de tu sitio."
      />
      <LinksManager
        initialLinks={links}
        initialSettings={{
          linksTagline: settings?.linksTagline ?? "",
          linksTaglineEn: settings?.linksTaglineEn ?? "",
          linksPattern: isLinkPattern(settings?.linksPattern) ? settings.linksPattern : "blobs",
          linksShowBrandKit: settings?.linksShowBrandKit ?? true,
          linksShowRecent: settings?.linksShowRecent ?? true,
        }} pageUrl={`${base}/enlaces`} previewPath={`${site?.previewPath ?? ""}/enlaces`} />
    </div>
  );
}
