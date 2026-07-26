import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import PackagesManager from "./PackagesManager";

export default async function AdminPackagesPage() {
  const packages = await prisma.package.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={`${packages.length} paquetes`}
        title="Elige lo que necesitas"
        description="Los paquetes de colaboración que ven las marcas antes de escribirte."
      />
      <PackagesManager initialPackages={packages} />
    </div>
  );
}
