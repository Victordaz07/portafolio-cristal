import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { canAccess } from "@/lib/circles";
import { accountPlan, canModerateCircle, circleMessages } from "@/lib/circles-server";
import { timeAgo } from "@/lib/community";
import { pick } from "@/lib/i18n";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import CircleChat from "./CircleChat";

export const dynamic = "force-dynamic";

/** Conversación de un círculo: solo para sus miembros. */
export default async function CircleRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { t, lang } = await getT();
  const { slug } = await params;
  const session = await getSession();
  if (!session) return null;
  const circle = await prismaRoot.circle.findUnique({ where: { slug }, include: { _count: { select: { members: true } } } });
  if (!circle || circle.archivedAt) notFound();
  const member = await prismaRoot.circleMember.findUnique({ where: { circleId_creatorId: { circleId: circle.id, creatorId: session.creatorId } }, select: { role: true } });
  if (!member || !canAccess(circle.crewOnly, await accountPlan(session.creatorId))) {
    return (
      <div className="flex flex-col gap-sp-5">
        <PageHeader eyebrow={t("Círculos", "Circles")} title={pick(lang, circle.name, circle.nameEn)} />
        <Card>
          <p className="text-sm text-ink/70">{t("Este círculo es solo para sus miembros.", "This circle is for members only.")}</p>
          <Link href="/admin/comunidad/circulos" className="mt-sp-2 inline-block text-sm font-semibold text-coral hover:underline">{t("Ver los círculos", "See the circles")}</Link>
        </Card>
      </div>
    );
  }
  const moderator = await canModerateCircle(circle.id, session.creatorId);
  const messages = await circleMessages(circle.id, session.creatorId, moderator);
  return (
    <div className="flex flex-col gap-sp-5">
      <Link href="/admin/comunidad/circulos" className="text-sm font-medium text-coral hover:underline">{t("← Círculos", "← Circles")}</Link>
      <PageHeader
        eyebrow={`${t("Círculo", "Circle")} · ${t(`${circle._count.members} miembros`, `${circle._count.members} members`)}`}
        title={pick(lang, circle.name, circle.nameEn)}
        description={circle.description ? pick(lang, circle.description, circle.descriptionEn) : undefined}
      />
      <CircleChat
        slug={circle.slug}
        moderator={moderator}
        messages={messages.map((m) => ({ ...m, ago: timeAgo(m.createdAt, lang), createdAt: undefined }))}
      />
    </div>
  );
}
