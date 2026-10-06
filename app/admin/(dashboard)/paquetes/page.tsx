import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import PackagesManager from "./PackagesManager";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminPackagesPage() {
  const { t } = await getT();
  const packages = await prisma.package.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={t(`${packages.length} paquetes`, `${packages.length} packages`)}
        title={t("Elige lo que necesitas", "Choose what you need")}
        description={t("Los paquetes de colaboración que ven las marcas antes de escribirte.", "The collaboration packages brands see before contacting you.")}
      />
      <PackagesManager initialPackages={packages} />
    </div>
  );
}
