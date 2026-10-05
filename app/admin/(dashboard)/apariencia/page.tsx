import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { designFromSettings } from "@/lib/design";
import { sessionCreatorSite } from "@/lib/site-url";
import DesignStudio from "./DesignStudio";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminAppearancePage() {
  const { t } = await getT();
  const [hero, settings, site] = await Promise.all([
    prisma.hero.findFirst({ select: { name: true, photoUrl: true, description: true, descriptionEn: true } }),
    prisma.siteSettings.findFirst({
      select: {
        accentColor: true,
        customAccent: true,
        themeStyle: true,
        fontPair: true,
        corners: true,
        background: true,
        heroLayout: true,
        sectionLayout: true,
        linksPattern: true,
        secondaryColor: true,
        contactPhotoUrl: true,
        brandsBannerUrl: true,
      },
    }),
    sessionCreatorSite(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow={t("Landing", "Landing page")}
        title={t("Estudio de diseño", "Design studio")}
        description={t("Haz que tu sitio se vea como tú: estilo, color, tipografía, portada y orden de las secciones, con vista previa en vivo.", "Make your site look like you: style, color, typography, cover and section order, with a live preview.")}
      />
      <DesignStudio
        initialProfile={{
          name: hero?.name ?? "",
          photoUrl: hero?.photoUrl ?? "",
          description: hero?.description ?? "",
          descriptionEn: hero?.descriptionEn ?? "",
          contactPhotoUrl: settings?.contactPhotoUrl ?? "",
          brandsBannerUrl: settings?.brandsBannerUrl ?? "",
        }}
        initialDesign={designFromSettings(settings)}
        previewPath={site?.previewPath ?? "/"}
        siteUrl={site?.url ?? "/"}
      />
    </div>
  );
}
