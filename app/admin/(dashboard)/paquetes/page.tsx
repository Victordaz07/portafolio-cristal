import { prisma } from "@/lib/prisma";
import PackagesManager from "./PackagesManager";

export default async function AdminPackagesPage() {
  const packages = await prisma.package.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-2">
        Elige lo que necesitas
      </h1>
      <p className="font-mono text-xs uppercase tracking-wide text-moss mb-sp-6">
        {packages.length} paquetes
      </p>
      <PackagesManager initialPackages={packages} />
    </div>
  );
}
