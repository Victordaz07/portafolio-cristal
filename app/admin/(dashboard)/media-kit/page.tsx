import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import StatsManager from "./StatsManager";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminMediaKitPage() {
  const { t } = await getT();
  const stats = await prisma.stat.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow={`${stats.length} stats`}
        title="Media kit"
        description={t("Las cifras que se muestran junto al hero para transmitir credibilidad.", "The numbers shown next to the hero to build credibility.")}
      />
      <StatsManager initialStats={stats} />
    </div>
  );
}
