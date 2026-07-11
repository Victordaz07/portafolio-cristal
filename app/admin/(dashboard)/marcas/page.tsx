import { prisma } from "@/lib/prisma";
import BrandsManager from "./BrandsManager";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-2">Marcas</h1>
      <p className="font-mono text-xs uppercase tracking-wide text-moss mb-sp-6">
        {brands.length} marcas
      </p>
      <BrandsManager initialBrands={brands} />
    </div>
  );
}
