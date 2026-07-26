import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import StatsManager from "./StatsManager";

export default async function AdminMediaKitPage() {
  const stats = await prisma.stat.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={`${stats.length} stats`}
        title="Media kit"
        description="Las cifras que se muestran junto al hero para transmitir credibilidad."
      />
      <StatsManager initialStats={stats} />
    </div>
  );
}
