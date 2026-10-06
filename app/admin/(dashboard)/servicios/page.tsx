import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import ServicesManager from "./ServicesManager";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminServicesPage() {
  const { t } = await getT();
  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={t(`${services.length} servicios`, `${services.length} services`)}
        title={t("Cómo trabajo contigo", "How I work with you")}
        description={t("Los servicios que ofreces, con su ícono, en la sección pública 'Cómo trabajo'.", "The services you offer, with their icon, in the public 'How I work' section.")}
      />
      <ServicesManager initialServices={services} />
    </div>
  );
}
