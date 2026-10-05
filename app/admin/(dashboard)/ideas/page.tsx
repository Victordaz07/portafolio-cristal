import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import IdeaForm from "@/components/admin/IdeaForm";
import { ideaCategoryLabel, ideaStatus } from "@/lib/ideas";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("es", { day: "numeric", month: "short" });

export default async function IdeasPage() {
  const session = await getSession();
  if (!session) return null;
  const [mine, planned, done] = await Promise.all([
    prismaRoot.idea.findMany({ where: { creatorId: session.creatorId }, orderBy: { createdAt: "desc" }, take: 30 }),
    prismaRoot.idea.findMany({ where: { status: "planned" }, orderBy: { updatedAt: "desc" }, take: 12, select: { id: true, title: true, category: true } }),
    prismaRoot.idea.findMany({ where: { status: "done" }, orderBy: { updatedAt: "desc" }, take: 8, select: { id: true, title: true, updatedAt: true } }),
  ]);

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Ayuda" title="Ideas y sugerencias" description="¿Qué te gustaría que Foliocrew hiciera por ti? Cada idea la lee el equipo y te avisamos cuando esté en camino." />
      <Card>
        <IdeaForm url="/api/admin/ideas" submitLabel="Enviar idea" placeholder="Ej.: Poder programar publicaciones de TikTok" />
      </Card>

      <div className="grid gap-sp-5 md:grid-cols-2">
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">🚧 En camino</p>
          {planned.length === 0 ? (
            <p className="text-sm text-ink/60">Pronto verás aquí lo que estamos preparando.</p>
          ) : (
            <ul className="flex flex-col gap-sp-2 text-sm">
              {planned.map((i) => (
                <li key={i.id} className="flex flex-wrap justify-between gap-sp-2">
                  <span className="font-semibold text-ink">{i.title}</span>
                  <span className="text-xs text-ink/50">{ideaCategoryLabel(i.category)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">✨ Recién lanzado</p>
          {done.length === 0 ? (
            <p className="text-sm text-ink/60">Aquí aparecerán las mejoras nuevas.</p>
          ) : (
            <ul className="flex flex-col gap-sp-2 text-sm">
              {done.map((i) => (
                <li key={i.id} className="flex flex-wrap justify-between gap-sp-2">
                  <span className="font-semibold text-ink">{i.title}</span>
                  <span className="text-xs text-ink/50">{fmt(i.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Tus sugerencias</p>
        {mine.length === 0 ? (
          <p className="text-sm text-ink/60">Todavía no enviaste ninguna. ¡La primera idea siempre es la mejor! 😉</p>
        ) : (
          <ul className="flex flex-col">
            {mine.map((i) => {
              const status = ideaStatus(i.status);
              return (
                <li key={i.id} className="flex flex-col gap-sp-1 border-t border-line py-sp-3 first:border-0">
                  <div className="flex flex-wrap items-center gap-sp-2">
                    <span className="flex-1 font-semibold text-ink">{i.title}</span>
                    <span className={`rounded-full px-[8px] py-px font-mono text-[10px] uppercase ${status.tone}`}>{status.label}</span>
                    <span className="text-xs text-ink/50">{fmt(i.createdAt)}</span>
                  </div>
                  {i.teamReply && <p className="rounded-[12px] bg-cream px-sp-3 py-sp-2 text-sm text-ink">💬 Equipo Foliocrew: {i.teamReply}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
