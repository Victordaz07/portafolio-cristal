import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import AppearanceForm from "./AppearanceForm";

export default async function AdminAppearancePage() {
  const [hero, settings] = await Promise.all([
    prisma.hero.findFirst({ select: { name: true, photoUrl: true, description: true, descriptionEn: true, niche: true } }),
    prisma.siteSettings.findFirst({ select: { accentColor: true, fontPairing: true, backgroundStyle: true } }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Landing"
        title="Apariencia"
        description="Tu foto, tu nombre, tu bio y el color de acento de todo el sitio (y de este panel)."
      />
      <AppearanceForm
        initial={{
          name: hero?.name ?? "",
          photoUrl: hero?.photoUrl ?? "",
          description: hero?.description ?? "",
          descriptionEn: hero?.descriptionEn ?? "",
          accentColor: settings?.accentColor ?? "lila",
          fontPairing: settings?.fontPairing ?? "editorial",
          backgroundStyle: settings?.backgroundStyle ?? "clasico",
        }}
        niche={hero?.niche ?? ""}
      />
    </div>
  );
}
