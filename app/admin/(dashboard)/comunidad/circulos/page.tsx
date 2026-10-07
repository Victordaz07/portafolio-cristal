import Link from "next/link";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { CIRCLE_KINDS, canAccess } from "@/lib/circles";
import { accountPlan } from "@/lib/circles-server";
import { pick } from "@/lib/i18n";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import CircleJoinButton from "./CircleJoinButton";

export const dynamic = "force-dynamic";

/** Círculos (E7): grupos de la comunidad por nicho, red o nivel. */
export default async function CirclesPage() {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const [circles, mine, account] = await Promise.all([
    prismaRoot.circle.findMany({ where: { archivedAt: null }, orderBy: [{ crewOnly: "asc" }, { name: "asc" }], include: { _count: { select: { members: true } } } }),
    prismaRoot.circleMember.findMany({ where: { creatorId: session.creatorId }, select: { circleId: true, role: true } }),
    accountPlan(session.creatorId),
  ]);
  const roleOf = new Map(mine.map((m) => [m.circleId, m.role]));
  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Comunidad", "Community")}
        title={t("Círculos", "Circles")}
        description={t("Grupos más pequeños para hablar con creadoras como tú: por nicho, por red social o por nivel. Únete a los que te sirvan.", "Smaller groups to talk with creators like you: by niche, social network or level. Join the ones that help you.")}
      />
      {circles.length === 0 ? (
        <Card><p className="text-sm text-ink/60">{t("Todavía no hay círculos. El equipo de Comunidad los irá abriendo.", "There are no circles yet. The Community team will open them soon.")}</p></Card>
      ) : (
        <div className="grid gap-sp-3 sm:grid-cols-2">
          {circles.map((c) => {
            const allowed = canAccess(c.crewOnly, account);
            const joined = roleOf.has(c.id);
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-sp-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-coral">{CIRCLE_KINDS.find((k) => k.id === c.kind)?.[lang === "en" ? "labelEn" : "label"]}{c.crewOnly ? " · Crew" : ""}</p>
                    <h2 className="font-fraunces text-xl font-medium text-ink">{pick(lang, c.name, c.nameEn)}</h2>
                  </div>
                  <span className="shrink-0 text-xs text-ink/50">{t(`${c._count.members} miembros`, `${c._count.members} members`)}</span>
                </div>
                {c.description && <p className="mt-sp-2 text-sm text-ink/70">{pick(lang, c.description, c.descriptionEn)}</p>}
                <div className="mt-sp-3 flex items-center justify-between gap-sp-2">
                  {joined ? (
                    <Link href={`/admin/comunidad/circulos/${c.slug}`} className="text-sm font-semibold text-coral hover:underline">{t("Entrar", "Enter")} →</Link>
                  ) : (
                    <span />
                  )}
                  {allowed || joined ? <CircleJoinButton slug={c.slug} joined={joined} /> : <span className="text-xs text-ink/50">{t("Disponible con el plan Crew", "Available with the Crew plan")}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
