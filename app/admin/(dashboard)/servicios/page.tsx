import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import ServicesManager from "./ServicesManager";

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={`${services.length} servicios`}
        title="Cómo trabajo contigo"
        description="Los servicios que ofreces, con su ícono, en la sección pública 'Cómo trabajo'."
      />
      <ServicesManager initialServices={services} />
    </div>
  );
}
