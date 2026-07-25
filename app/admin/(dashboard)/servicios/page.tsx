import { prisma } from "@/lib/prisma";
import ServicesManager from "./ServicesManager";

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-2">
        Cómo trabajo contigo
      </h1>
      <p className="font-mono text-xs uppercase tracking-wide text-moss mb-sp-6">
        {services.length} servicios
      </p>
      <ServicesManager initialServices={services} />
    </div>
  );
}
