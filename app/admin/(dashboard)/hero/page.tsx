import { prisma } from "@/lib/prisma";
import HeroForm from "./HeroForm";

export default async function AdminHeroPage() {
  const hero = await prisma.hero.findFirst();

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-6">Hero</h1>
      <HeroForm initialHero={hero} />
    </div>
  );
}
