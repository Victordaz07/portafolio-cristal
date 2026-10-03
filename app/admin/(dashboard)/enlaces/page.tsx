import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { sessionCreatorSite } from "@/lib/site-url";
import { ensureLinkGroups } from "@/lib/link-page";
import LinkEditor from "./LinkEditor";

export default async function AdminLinksPage() {
  const [groups, site, settings, hero] = await Promise.all([
    ensureLinkGroups(),
    sessionCreatorSite(),
    prisma.siteSettings.findFirst({
      select: {
        linksTagline: true,
        linksTaglineEn: true,
        linksShowCopy: true,
        linksShowSocials: true,
        linksHeroShow: true,
        linksHeroEyebrow: true,
        linksHeroEyebrowEn: true,
        linksHeroTitle: true,
        linksHeroTitleEn: true,
        linksHeroImage: true,
        linksHeroUrl: true,
      },
    }),
    prisma.hero.findFirst({ select: { photoUrl: true } }),
  ]);
  const base = (site?.url ?? "").replace(/\/$/, "");

  return (
    <div>
      <PageHeader
        eyebrow="Landing"
        title="Link en bio"
        description="Tu página para la bio de Instagram y TikTok. Decide qué se ve, en qué orden y cómo: toca cualquier parte de la vista previa para editarla."
      />
      <LinkEditor
        initialGroups={groups}
        initialPage={{
          linksTagline: settings?.linksTagline ?? "",
          linksTaglineEn: settings?.linksTaglineEn ?? "",
          linksShowCopy: settings?.linksShowCopy ?? true,
          linksShowSocials: settings?.linksShowSocials ?? true,
          linksHeroShow: settings?.linksHeroShow ?? true,
          linksHeroEyebrow: settings?.linksHeroEyebrow ?? "",
          linksHeroEyebrowEn: settings?.linksHeroEyebrowEn ?? "",
          linksHeroTitle: settings?.linksHeroTitle ?? "",
          linksHeroTitleEn: settings?.linksHeroTitleEn ?? "",
          linksHeroImage: settings?.linksHeroImage ?? "",
          linksHeroUrl: settings?.linksHeroUrl ?? "",
        }}
        pageUrl={`${base}/links`}
        previewPath={`${(site?.previewPath ?? "").replace(/\/$/, "")}/links`}
        heroPhoto={hero?.photoUrl ?? null}
      />
    </div>
  );
}
