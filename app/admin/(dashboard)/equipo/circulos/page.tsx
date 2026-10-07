import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { hasRole, teamUser } from "@/lib/team";
import { getT } from "@/lib/admin-lang-server";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import CirclesAdmin from "./CirclesAdmin";

export const dynamic = "force-dynamic";

/** Departamento de Comunidad: crear círculos, nombrar moderadoras y programar sesiones. */
export default async function CirclesTeamPage() {
  const { t } = await getT();
  const user = await teamUser();
  if (!hasRole(user, "community")) notFound();
  const [circles, sessions] = await Promise.all([
    prismaRoot.circle.findMany({ orderBy: [{ archivedAt: "asc" }, { name: "asc" }], include: { _count: { select: { members: true, messages: true } }, members: { where: { role: "moderator" }, select: { creator: { select: { slug: true } } } } } }),
    prismaRoot.liveSession.findMany({ orderBy: { startsAt: "desc" }, take: 30, include: { _count: { select: { rsvps: true } } } }),
  ]);
  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Comunidad", "Community")}
        title={t("Círculos y sesiones", "Circles & sessions")}
        description={t("Abre círculos por nicho, red o nivel, nombra a sus moderadoras y programa sesiones en vivo y mentorías. Lo marcado como Crew es un beneficio del plan Crew.", "Open circles by niche, network or level, name their moderators and schedule live sessions and mentoring. Anything marked Crew is a Crew plan benefit.")}
      />
      <Card>
        <CirclesAdmin
          circles={circles.map((c) => ({ id: c.id, slug: c.slug, name: c.name, kind: c.kind, crewOnly: c.crewOnly, archived: Boolean(c.archivedAt), members: c._count.members, messages: c._count.messages, moderators: c.members.map((m) => m.creator.slug) }))}
          sessions={sessions.map((s) => ({ id: s.id, kind: s.kind, title: s.title, hostName: s.hostName, startsAt: s.startsAt.toISOString(), durationMin: s.durationMin, crewOnly: s.crewOnly, capacity: s.capacity, rsvps: s._count.rsvps, canceled: Boolean(s.canceledAt) }))}
        />
      </Card>
    </div>
  );
}
