import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import HeroForm from "./HeroForm";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminHeroPage() {
  const { t } = await getT();
  const hero = await prisma.hero.findFirst();

  return (
    <div>
      <PageHeader
        eyebrow={t("Portada", "Cover")}
        title="Hero"
        description={t("Lo primero que ve cualquier persona al entrar al sitio — edita y mira el resultado en vivo a la derecha.", "The first thing anyone sees on your site — edit it and watch the live result on the right.")}
      />
      <HeroForm initialHero={hero} />
    </div>
  );
}
