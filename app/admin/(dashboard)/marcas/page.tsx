import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import BrandsManager from "./BrandsManager";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={`${brands.length} marcas`}
        title="Marcas"
        description="Las marcas y colaboraciones que se muestran en el carrusel del sitio público."
      />
      <BrandsManager initialBrands={brands} />
    </div>
  );
}
