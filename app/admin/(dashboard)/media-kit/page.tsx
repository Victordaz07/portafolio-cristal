import { prisma } from "@/lib/prisma";
import StatsManager from "./StatsManager";

export default async function AdminMediaKitPage() {
  const stats = await prisma.stat.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-2">
        Media kit
      </h1>
      <p className="font-mono text-xs uppercase tracking-wide text-moss mb-sp-6">
        {stats.length} stats
      </p>
      <StatsManager initialStats={stats} />
    </div>
  );
}
