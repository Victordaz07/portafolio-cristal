import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import IdeaForm from "@/components/admin/IdeaForm";
import { IDEA_STATUS, isIdeaStatus } from "@/lib/ideas";
import { requireRole } from "@/lib/team";
import IdeaRow from "./IdeaRow";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("es", { day: "numeric", month: "short" });

export default async function TeamIdeasPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const user = await requireRole("growth");
  if (!user) notFound();
  const { s } = await searchParams;
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
        eyebrow="Equipo Foliocrew"
        title="Mejora continua"
        description="Sugerencias de las cuentas e ideas del equipo. Al pasar una sugerencia a «Planeada» o «¡Ya está!», le avisamos a la cuenta por correo."
      />
      <div className="flex flex-wrap gap-sp-2">
        {IDEA_STATUS.map((x) => (
          <Link
            key={x.id}
            href={`/admin/equipo/ideas?s=${x.id}`}
            className={`rounded-full border px-sp-4 py-1.5 text-sm font-semibold ${status === x.id ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink hover:border-coral"}`}
          >
            {x.label} <span className="opacity-60">{countFor(x.id)}</span>
          </Link>
        ))}
      </div>
      <Card>
        {ideas.length === 0 ? (
          <p className="text-sm text-ink/60">No hay ideas en este estado.</p>
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
                  createdAt: fmt(i.createdAt),
                }}
              />
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">🧠 Nueva idea del equipo</p>
        <IdeaForm url="/api/admin/team/ideas" submitLabel="Guardar idea" placeholder="Ej.: Plantillas de media kit por nicho" />
      </Card>
    </div>
  );
}
