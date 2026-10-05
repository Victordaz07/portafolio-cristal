import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import IdeaForm from "@/components/admin/IdeaForm";
import { IDEA_STATUS, isIdeaStatus } from "@/lib/ideas";
import { requireRole } from "@/lib/team";
import IdeaRow from "./IdeaRow";
import { dateLocale, pickLabel, type AdminLang } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const fmt = (d: Date, lang: AdminLang) => d.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short" });

export default async function TeamIdeasPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const user = await requireRole("growth");
  if (!user) notFound();
  const { s } = await searchParams;
  const { t, lang } = await getT();
  const status = s && isIdeaStatus(s) ? s : "new";
  const [ideas, counts] = await Promise.all([
    prismaRoot.idea.findMany({
      where: { status },
      orderBy: { createdAt: status === "new" ? "asc" : "desc" },
      take: 100,
      include: { creator: { select: { name: true } } },
    }),
    prismaRoot.idea.groupBy({ by: ["status"], _count: true }),
  ]);
  const countFor = (id: string) => counts.find((c) => c.status === id)?._count ?? 0;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Departamentos Foliocrew", "Foliocrew departments")}
        title={t("💡 Centro de sugerencias", "💡 Suggestions center")}
        description={t(
          "Sugerencias de las cuentas e ideas del equipo. Al pasar una sugerencia a «Planeada» o «¡Ya está!», le avisamos a la cuenta por correo.",
          "Suggestions from accounts and ideas from the team. When you move a suggestion to “Planned” or “Shipped!”, we email the account."
        )}
      />
      <div className="flex flex-wrap gap-sp-2">
        {IDEA_STATUS.map((x) => (
          <Link
            key={x.id}
            href={`/admin/equipo/ideas?s=${x.id}`}
            className={`rounded-full border px-sp-4 py-1.5 text-sm font-semibold ${status === x.id ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink hover:border-coral"}`}
          >
            {pickLabel(lang, x)} <span className="opacity-60">{countFor(x.id)}</span>
          </Link>
        ))}
      </div>
      <Card>
        {ideas.length === 0 ? (
          <p className="text-sm text-ink/60">{t("No hay ideas en este estado.", "No ideas in this status.")}</p>
        ) : (
          <ul className="flex flex-col">
            {ideas.map((i) => (
              <IdeaRow
                key={i.id}
                idea={{
                  id: i.id,
                  title: i.title,
                  description: i.description,
                  category: i.category,
                  status: i.status,
                  teamReply: i.teamReply,
                  internalNote: i.internalNote,
                  fromAccount: Boolean(i.creatorId),
                  source: i.creator?.name ?? i.authorName ?? i.authorEmail,
                  createdAt: fmt(i.createdAt, lang),
                }}
              />
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("🧠 Nueva idea del equipo", "🧠 New team idea")}</p>
        <IdeaForm url="/api/admin/team/ideas" submitLabel={t("Guardar idea", "Save idea")} placeholder={t("Ej.: Plantillas de media kit por nicho", "E.g.: Media kit templates by niche")} />
      </Card>
    </div>
  );
}
