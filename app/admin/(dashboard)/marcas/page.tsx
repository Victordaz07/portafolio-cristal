import { prisma } from "@/lib/prisma";
import { brandCrmInclude } from "@/lib/brand-crm";
import { isDealStatus } from "@/lib/crm";
import PageHeader from "@/components/admin/PageHeader";
import BrandsManager, { type BrandCrm } from "./BrandsManager";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({ orderBy: { order: "asc" }, include: brandCrmInclude });
  const deals = brands.filter((brand) => isDealStatus(brand.dealStatus)).length;

  return (
    <div>
      <PageHeader
        eyebrow={`Prueba social · ${brands.length} marcas · ${deals} en trato`}
        title="Marcas"
        description="Tu CRM de colaboraciones y el carrusel de logos del sitio público."
      />
      {/* JSON round-trip: el cliente recibe las fechas como string, igual que desde la API. */}
      <BrandsManager initialBrands={JSON.parse(JSON.stringify(brands)) as BrandCrm[]} />
    </div>
  );
}
