import Link from "next/link";
import { prismaRoot } from "@/lib/prisma-root";
import Card from "@/components/admin/Card";
import { adminEmails } from "@/lib/platform-admin";
import { IDEA_STATUS } from "@/lib/ideas";
import { dataRequestKindLabel } from "@/lib/data-export";
import { TEAM_ROLES, type TeamRole } from "@/lib/team-roles";
import { startOfMonth } from "@/lib/platform-stats";
import { Stat, eyebrowClass } from "./charts";
import { pickLabel, type AdminLang } from "@/lib/admin-lang";
import { reportReasonLabel } from "@/lib/community";
import { getT } from "@/lib/admin-lang-server";

const DAY = 86_400_000;
const ago = (d: Date, lang: AdminLang) => {
  const days = Math.floor((Date.now() - d.getTime()) / DAY);
  if (lang === "en") return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  if (days <= 0) return "hoy";
  return days === 1 ? "ayer" : `hace ${days} días`;
};

/** Departamentos del equipo (ayuda, sugerencias, recuperación de datos, comunidad) vistos desde el Centro de mando. */
export default async function DepartmentsSection() {
  const { t, lang } = await getT();
  const month = startOfMonth();
  const [members, tickets, ticketsClosedMonth, recentTickets, ideas, recentIdeas, dataOpen, dataDoneMonth, recentData, reportsOpen, reportsDoneMonth, recentReports, posts30] = await Promise.all([
    prismaRoot.teamMember.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } }),
    prismaRoot.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
    prismaRoot.supportTicket.count({ where: { status: "closed", updatedAt: { gte: month } } }),
    prismaRoot.supportTicket.findMany({
      where: { status: { not: "closed" } },
      orderBy: { lastActivityAt: "asc" },
      take: 5,
      include: { creator: { select: { name: true } } },
    }),
    prismaRoot.idea.groupBy({ by: ["status"], _count: { _all: true } }),
    prismaRoot.idea.findMany({ where: { status: { in: ["new", "review"] } }, orderBy: { createdAt: "desc" }, take: 5 }),
    prismaRoot.dataRequest.count({ where: { status: "open" } }),
    prismaRoot.dataRequest.count({ where: { status: { not: "open" }, resolvedAt: { gte: month } } }),
    prismaRoot.dataRequest.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "asc" },
      take: 5,
      include: { creator: { select: { name: true } } },
    }),
    prismaRoot.communityReport.count({ where: { status: "open" } }),
    prismaRoot.communityReport.count({ where: { status: { not: "open" }, resolvedAt: { gte: month } } }),
    prismaRoot.communityReport.findMany({ where: { status: "open" }, orderBy: { createdAt: "asc" }, take: 5 }),
    prismaRoot.communityPost.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * DAY) }, deletedAt: null } }),
  ]);
  const ticketCount = (s: string) => tickets.find((x) => x.status === s)?._count._all ?? 0;
  const ideaCount = (s: string) => ideas.find((i) => i.status === s)?._count._all ?? 0;
  const owners = adminEmails();
  const peopleWith = (role: TeamRole) => [
    ...owners.map((email) => ({ key: email, name: email, owner: true })),
    ...members.filter((m) => m.roles.includes(role)).map((m) => ({ key: m.id, name: m.name || m.email, owner: false })),
  ];

  const departments = [
    {
      role: "support" as const,
      title: t("🎧 Centro de ayuda", "🎧 Help center"),
      text: t(
        "Tickets de las cuentas cuando algo no funciona. Responde, deja notas internas y entra a una cuenta (con motivo) para ayudar.",
        "Account tickets when something isn't working. Reply, leave internal notes and enter an account (with a reason) to help."
      ),
      href: "/admin/equipo/soporte",
      stats: [
        { label: t("Abiertos", "Open"), value: ticketCount("open") },
        { label: t("Esperando a la cuenta", "Waiting on account"), value: ticketCount("waiting") },
        { label: t("Cerrados este mes", "Closed this month"), value: ticketsClosedMonth },
      ],
      empty: t("No hay tickets pendientes. 🎉", "No pending tickets. 🎉"),
      items: recentTickets.map((tk) => ({
        id: tk.id,
        href: `/admin/equipo/soporte/${tk.id}`,
        title: `#${tk.number} ${tk.subject}`,
        meta: `${tk.creator.name} · ${tk.status === "open" ? t("abierto", "open") : t("esperando", "waiting")} · ${ago(tk.lastActivityAt, lang)}`,
        urgent: tk.status === "open" && Date.now() - tk.lastActivityAt.getTime() > DAY,
      })),
    },
    {
      role: "growth" as const,
      title: t("💡 Centro de sugerencias", "💡 Suggestions center"),
      text: t(
        "Ideas de las cuentas para mejorar Foliocrew e ideas del equipo. Cuando una se planea o se lanza, la cuenta recibe un correo.",
        "Ideas from accounts to improve Foliocrew, plus team ideas. When one is planned or launched, the account gets an email."
      ),
      href: "/admin/equipo/ideas",
      stats: IDEA_STATUS.filter((s) => s.id !== "declined").map((s) => ({ label: pickLabel(lang, s), value: ideaCount(s.id) })),
      empty: t("No hay sugerencias por revisar.", "No suggestions to review."),
      items: recentIdeas.map((i) => ({
        id: i.id,
        href: "/admin/equipo/ideas",
        title: i.title,
        meta: `${i.creatorId ? i.authorName || i.authorEmail : t("Idea del equipo", "Team idea")} · ${ago(i.createdAt, lang)}`,
        urgent: false,
      })),
    },
    {
      role: "data" as const,
      title: t("🛟 Recuperación de datos", "🛟 Data recovery"),
      text: t(
        "Pedidos de copia, recuperación o borrado de datos de una cuenta. Cada copia que saca el equipo queda registrada y la cuenta la ve.",
        "Requests to copy, recover or delete an account's data. Every copy the team exports is logged and the account can see it."
      ),
      href: "/admin/equipo/datos",
      stats: [
        { label: t("Pedidos abiertos", "Open requests"), value: dataOpen },
        { label: t("Resueltos este mes", "Resolved this month"), value: dataDoneMonth },
      ],
      empty: t("No hay pedidos de datos abiertos.", "No open data requests."),
      items: recentData.map((d) => ({
        id: d.id,
        href: "/admin/equipo/datos",
        title: dataRequestKindLabel(d.kind, lang),
        meta: `${d.creator.name} · ${ago(d.createdAt, lang)}`,
        urgent: d.kind === "delete" || Date.now() - d.createdAt.getTime() > 2 * DAY,
      })),
    },
    {
      role: "community" as const,
      title: t("🛡️ Comunidad", "🛡️ Community"),
      text: t(
        "Modera el muro de la comunidad: revisa reportes, oculta lo que rompe las reglas y pausa cuentas. La persona recibe un correo cuando se actúa.",
        "Moderates the community wall: reviews reports, hides what breaks the rules and pauses accounts. The person gets an email when action is taken."
      ),
      href: "/admin/equipo/comunidad",
      stats: [
        { label: t("Reportes abiertos", "Open reports"), value: reportsOpen },
        { label: t("Resueltos este mes", "Resolved this month"), value: reportsDoneMonth },
        { label: t("Publicaciones (30 días)", "Posts (30 days)"), value: posts30 },
      ],
      empty: t("No hay reportes abiertos.", "No open reports."),
      items: recentReports.map((rp) => ({
        id: rp.id,
        href: "/admin/equipo/comunidad",
        title: `${reportReasonLabel(rp.reason, lang)} · ${rp.targetType}`,
        meta: ago(rp.createdAt, lang),
        urgent: rp.reason === "estafa",
      })),
    },
  ];

  return (
    <div className="flex flex-col gap-sp-5">
      {departments.map((d) => {
        const people = peopleWith(d.role);
        const role = TEAM_ROLES.find((r) => r.id === d.role);
        return (
          <Card key={d.role}>
            <div className="flex flex-wrap items-start justify-between gap-sp-3">
              <div className="max-w-2xl">
                <p className="text-lg font-semibold text-ink">{d.title}</p>
                <p className="mt-sp-1 text-sm text-ink/70">{d.text}</p>
              </div>
              <Link href={d.href} className="rounded-full bg-ink px-sp-4 py-2 text-sm font-semibold text-cream hover:bg-coral">
                {t("Abrir departamento →", "Open department →")}
              </Link>
            </div>

            <div className="mt-sp-4 grid grid-cols-2 gap-sp-3 md:grid-cols-4">
              {d.stats.map((s) => (
                <Stat key={s.label} label={s.label} value={String(s.value)} />
              ))}
            </div>

            <div className="mt-sp-5 grid gap-sp-5 md:grid-cols-[2fr_1fr]">
              <div>
                <p className={`${eyebrowClass} mb-sp-2`}>{t("Para atender", "To handle")}</p>
                {d.items.length === 0 ? (
                  <p className="text-sm text-ink/60">{d.empty}</p>
                ) : (
                  <ul className="flex flex-col gap-sp-2 text-sm">
                    {d.items.map((item) => (
                      <li key={item.id} className="flex flex-col border-t border-line pt-sp-2 first:border-0 first:pt-0">
                        <Link href={item.href} className="font-semibold text-ink hover:text-coral">
                          {item.urgent && <span className="mr-1 text-red-700">●</span>}
                          {item.title}
                        </Link>
                        <span className="text-xs text-ink/60">{item.meta}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className={`${eyebrowClass} mb-sp-2`}>{t("Quién atiende", "Who handles it")}</p>
                <ul className="flex flex-col gap-sp-1 text-sm">
                  {people.map((p) => (
                    <li key={p.key} className="flex flex-wrap items-center gap-sp-1">
                      <span className="text-ink">{p.name}</span>
                      {p.owner && <span className="rounded-full bg-ink px-[6px] py-px font-mono text-[9px] uppercase text-cream">{t("Dueño", "Owner")}</span>}
                    </li>
                  ))}
                </ul>
                <p className="mt-sp-2 text-xs text-ink/50">{lang === "en" ? role?.hintEn : role?.hint}</p>
                <Link href="/admin/equipo/personas" className="mt-sp-2 inline-block text-xs font-semibold text-coral hover:underline">
                  {t("Sumar a alguien →", "Add someone →")}
                </Link>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
