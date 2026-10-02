import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { MOTIVATIONAL_PHRASES } from "@/lib/motivational-phrases";
import { weekStartOf, weekLabel, goalPercent } from "@/lib/growth";
import { resolveGoalValues, todayKey } from "@/lib/growth-server";
import GoalsManager, { type GoalView, type ActionView } from "./GoalsManager";

export default async function AdminGoalsPage() {
  const today = todayKey();
  const weekStart = weekStartOf(today);
  const [goals, actions, pendingOld, connected] = await Promise.all([
    prisma.goal.findMany({ where: { archived: false }, orderBy: { order: "asc" } }),
    prisma.actionItem.findMany({ where: { weekStart }, orderBy: [{ done: "asc" }, { order: "asc" }] }),
    prisma.actionItem.count({ where: { done: false, weekStart: { lt: weekStart } } }),
    prisma.socialAccount.findMany({ select: { platform: true } }),
  ]);

  const resolved = await resolveGoalValues(goals);
  const overall = resolved.length
    ? Math.round(resolved.reduce((sum, g) => sum + goalPercent(g.current, g.target), 0) / resolved.length)
    : 0;

  // Una frase distinta cada día, de las 40 frases del sitio.
  const dayNumber = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86_400_000);
  const phrase = MOTIVATIONAL_PHRASES[dayNumber % MOTIVATIONAL_PHRASES.length].es;

  return (
    <div>
      <PageHeader eyebrow="Crecimiento" title="Metas y plan" />
      <GoalsManager
        phrase={phrase}
        overall={overall}
        weekLabel={weekLabel(weekStart)}
        pendingOld={pendingOld}
        connectedPlatforms={connected.map((c) => c.platform)}
        initialGoals={JSON.parse(JSON.stringify(resolved)) as GoalView[]}
        initialActions={JSON.parse(JSON.stringify(actions)) as ActionView[]}
      />
    </div>
  );
}
