import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { SUPPORT_STATUS_TEAM, supportCategoryLabel } from "@/lib/support";
import { requireRole } from "@/lib/team";
import { dateLocale, pickLabel, type AdminLang } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const FILTERS = [
  { id: "open", label: "Abiertos", labelEn: "Open" },
  { id: "waiting", label: "Esperando a la cuenta", labelEn: "Waiting for the account" },
  { id: "mine", label: "Asignados a mí", labelEn: "Assigned to me" },
  { id: "closed", label: "Cerrados", labelEn: "Closed" },
] as const;

const fmt = (d: Date, lang: AdminLang) => d.toLocaleString(dateLocale(lang), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function TeamSupportPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { t, lang } = await getT();
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
      <PageHeader
        eyebrow={t("Departamentos Foliocrew", "Foliocrew departments")}
        title={t("🎧 Centro de ayuda", "🎧 Help center")}
        description={t("Atiende primero los más antiguos. Las respuestas le llegan a la cuenta por correo y en su panel.", "Handle the oldest first. Replies reach the account by email and in their dashboard.")}
      />
      <div className="flex flex-wrap gap-sp-2">
        {FILTERS.map((x) => (
          <Link
            key={x.id}
            href={`/admin/equipo/soporte?f=${x.id}`}
            className={`rounded-full border px-sp-4 py-1.5 text-sm font-semibold ${filter === x.id ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink hover:border-coral"}`}
          >
            {pickLabel(lang, x)}
            {x.id !== "mine" && <span className="ml-1 opacity-60">{countFor(x.id)}</span>}
          </Link>
        ))}
      </div>
      <Card>
        {tickets.length === 0 ? (
          <p className="text-sm text-ink/60">{t("No hay tickets aquí. 🎉", "No tickets here. 🎉")}</p>
        ) : (
          <ul className="flex flex-col">
            {tickets.map((tk) => (
              <li key={tk.id} className="border-t border-line first:border-0">
                <Link href={`/admin/equipo/soporte/${tk.id}`} className="flex flex-wrap items-center gap-sp-3 py-sp-3 hover:text-coral">
                  <span className="font-mono text-xs text-ink/50">#{tk.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{tk.subject}</span>
                    <span className="text-xs text-ink/60">
                      {tk.creator.name} · {supportCategoryLabel(tk.category, lang)}
                      {tk.assignedTo ? ` · ${t("Atiende", "Handled by")}: ${tk.assignedTo}` : t(" · Sin asignar", " · Unassigned")}
                    </span>
                  </span>
                  <span className="rounded-full bg-ink/5 px-[8px] py-px font-mono text-[10px] uppercase text-ink/70">{SUPPORT_STATUS_TEAM[tk.status] ? pickLabel(lang, SUPPORT_STATUS_TEAM[tk.status]) : tk.status}</span>
                  <span className="text-xs text-ink/50">{fmt(tk.lastActivityAt, lang)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
