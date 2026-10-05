import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { SUPPORT_STATUS_TEAM, supportCategoryLabel } from "@/lib/support";
import { requireRole } from "@/lib/team";

export const dynamic = "force-dynamic";

const FILTERS = [
  { id: "open", label: "Abiertos" },
  { id: "waiting", label: "Esperando a la cuenta" },
  { id: "mine", label: "Asignados a mí" },
  { id: "closed", label: "Cerrados" },
] as const;

const fmt = (d: Date) => d.toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function TeamSupportPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const user = await requireRole("support");
  if (!user) notFound();
  const { f } = await searchParams;
  const filter = FILTERS.some((x) => x.id === f) ? (f as (typeof FILTERS)[number]["id"]) : "open";
  const where =
    filter === "mine" ? { assignedTo: user.email, status: { not: "closed" } } : { status: filter };

  const [tickets, counts] = await Promise.all([
    prismaRoot.supportTicket.findMany({
      where,
      orderBy: { lastActivityAt: filter === "closed" ? "desc" : "asc" },
      take: 100,
      include: { creator: { select: { name: true, slug: true } } },
    }),
    prismaRoot.supportTicket.groupBy({ by: ["status"], _count: true }),
  ]);
  const countFor = (status: string) => counts.find((c) => c.status === status)?._count ?? 0;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Equipo Foliocrew" title="Centro de soporte" description="Atiende primero los más antiguos. Las respuestas le llegan a la cuenta por correo y en su panel." />
      <div className="flex flex-wrap gap-sp-2">
        {FILTERS.map((x) => (
          <Link
            key={x.id}
            href={`/admin/equipo/soporte?f=${x.id}`}
            className={`rounded-full border px-sp-4 py-1.5 text-sm font-semibold ${filter === x.id ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink hover:border-coral"}`}
          >
            {x.label}
            {x.id !== "mine" && <span className="ml-1 opacity-60">{countFor(x.id)}</span>}
          </Link>
        ))}
      </div>
      <Card>
        {tickets.length === 0 ? (
          <p className="text-sm text-ink/60">No hay tickets aquí. 🎉</p>
        ) : (
          <ul className="flex flex-col">
            {tickets.map((t) => (
              <li key={t.id} className="border-t border-line first:border-0">
                <Link href={`/admin/equipo/soporte/${t.id}`} className="flex flex-wrap items-center gap-sp-3 py-sp-3 hover:text-coral">
                  <span className="font-mono text-xs text-ink/50">#{t.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{t.subject}</span>
                    <span className="text-xs text-ink/60">
                      {t.creator.name} · {supportCategoryLabel(t.category)}
                      {t.assignedTo ? ` · Atiende: ${t.assignedTo}` : " · Sin asignar"}
                    </span>
                  </span>
                  <span className="rounded-full bg-ink/5 px-[8px] py-px font-mono text-[10px] uppercase text-ink/70">{SUPPORT_STATUS_TEAM[t.status] ?? t.status}</span>
                  <span className="text-xs text-ink/50">{fmt(t.lastActivityAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
