import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { getActivityStreak, todayKey } from "@/lib/growth-server";
import LogManager, { type LogView } from "./LogManager";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminLogPage() {
  const { t } = await getT();
  const [entries, streak] = await Promise.all([
    prisma.logEntry.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    getActivityStreak(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow={t("Crecimiento", "Growth")}
        title={t("Bitácora", "Journal")}
        description={t("Tus hitos, aprendizajes y reflexiones. Es privada: no se muestra en el sitio público.", "Your milestones, lessons and reflections. It's private: not shown on your public site.")}
      />
      <LogManager
        initialEntries={entries.map(({ id, kind, date, title, body }) => ({ id, kind, date, title, body })) as LogView[]}
        streak={streak}
        today={todayKey()}
      />
    </div>
  );
}
