import { prisma } from "@/lib/prisma";
import { brandCrmInclude } from "@/lib/brand-crm";
import { isDealStatus } from "@/lib/crm";
import PageHeader from "@/components/admin/PageHeader";
import BrandsManager, { type BrandCrm } from "./BrandsManager";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminBrandsPage() {
  const { t } = await getT();
  const brands = await prisma.brand.findMany({ orderBy: { order: "asc" }, include: brandCrmInclude });
  const deals = brands.filter((brand) => isDealStatus(brand.dealStatus)).length;

  return (
    <div>
      <PageHeader
        eyebrow={t(`Prueba social · ${brands.length} marcas · ${deals} en trato`, `Social proof · ${brands.length} brands · ${deals} in deals`)}
        title={t("Marcas", "Brands")}
        description={t("Tu CRM de colaboraciones y el carrusel de logos del sitio público.", "Your collaborations CRM and the logo carousel on your public site.")}
      />
      {/* JSON round-trip: el cliente recibe las fechas como string, igual que desde la API. */}
      <BrandsManager initialBrands={JSON.parse(JSON.stringify(brands)) as BrandCrm[]} />
    </div>
  );
}
