import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import HeroForm from "./HeroForm";

export default async function AdminHeroPage() {
  const hero = await prisma.hero.findFirst();

  return (
    <div>
      <PageHeader
        eyebrow="Portada"
        title="Hero"
        description="Lo primero que ve cualquier persona al entrar al sitio — edita y mira el resultado en vivo a la derecha."
      />
      <HeroForm initialHero={hero} />
    </div>
  );
}
