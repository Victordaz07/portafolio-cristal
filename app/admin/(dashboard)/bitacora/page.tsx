import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { getActivityStreak, todayKey } from "@/lib/growth-server";
import LogManager, { type LogView } from "./LogManager";

export default async function AdminLogPage() {
  const [entries, streak] = await Promise.all([
    prisma.logEntry.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    getActivityStreak(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Crecimiento"
        title="Bitácora"
        description="Tus hitos, aprendizajes y reflexiones. Es privada: no se muestra en el sitio público."
      />
      <LogManager
        initialEntries={entries.map(({ id, kind, date, title, body }) => ({ id, kind, date, title, body })) as LogView[]}
        streak={streak}
        today={todayKey()}
      />
    </div>
  );
}
