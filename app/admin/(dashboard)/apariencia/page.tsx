import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { designFromSettings } from "@/lib/design";
import { sessionCreatorSite } from "@/lib/site-url";
import DesignStudio from "./DesignStudio";

export default async function AdminAppearancePage() {
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
      },
    }),
    sessionCreatorSite(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Landing"
        title="Estudio de diseño"
        description="Haz que tu sitio se vea como tú: estilo, color, tipografía, portada y orden de las secciones, con vista previa en vivo."
      />
      <DesignStudio
        initialProfile={{
          name: hero?.name ?? "",
          photoUrl: hero?.photoUrl ?? "",
          description: hero?.description ?? "",
          descriptionEn: hero?.descriptionEn ?? "",
        }}
        initialDesign={designFromSettings(settings)}
        previewPath={site?.previewPath ?? "/"}
        siteUrl={site?.url ?? "/"}
      />
    </div>
  );
}
