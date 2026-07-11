import { prisma } from "@/lib/prisma";
import PricingManager from "./PricingManager";

export default async function AdminPaquetesPage() {
  const packages = await prisma.pricingPackage.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-2">
        Paquetes
      </h1>
      <p className="font-mono text-xs uppercase tracking-wide text-moss mb-sp-6">
        {packages.length} paquetes
      </p>
      <PricingManager initialPackages={packages} />
    </div>
  );
}
