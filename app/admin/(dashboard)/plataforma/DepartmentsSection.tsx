import Link from "next/link";
import { prismaRoot } from "@/lib/prisma-root";
import Card from "@/components/admin/Card";
import { adminEmails } from "@/lib/platform-admin";
import { IDEA_STATUS } from "@/lib/ideas";
import { dataRequestKindLabel } from "@/lib/data-export";
import { TEAM_ROLES, type TeamRole } from "@/lib/team-roles";
import { startOfMonth } from "@/lib/platform-stats";
import { Stat, eyebrowClass } from "./charts";

const DAY = 86_400_000;
const ago = (d: Date) => {
  const days = Math.floor((Date.now() - d.getTime()) / DAY);
  if (days <= 0) return "hoy";
  return days === 1 ? "ayer" : `hace ${days} días`;
};

/** Departamentos del equipo (ayuda, sugerencias, recuperación de datos) vistos desde el Centro de mando. */
export default async function DepartmentsSection() {
  const month = startOfMonth();
  const [members, tickets, ticketsClosedMonth, recentTickets, ideas, recentIdeas, dataOpen, dataDoneMonth, recentData] = await Promise.all([
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
  ]);
  const ticketCount = (s: string) => tickets.find((t) => t.status === s)?._count._all ?? 0;
  const ideaCount = (s: string) => ideas.find((i) => i.status === s)?._count._all ?? 0;
  const owners = adminEmails();
  const peopleWith = (role: TeamRole) => [
    ...owners.map((email) => ({ key: email, name: email, owner: true })),
    ...members.filter((m) => m.roles.includes(role)).map((m) => ({ key: m.id, name: m.name || m.email, owner: false })),
  ];

  const departments = [
    {
      role: "support" as const,
      title: "🎧 Centro de ayuda",
      text: "Tickets de las cuentas cuando algo no funciona. Responde, deja notas internas y entra a una cuenta (con motivo) para ayudar.",
      href: "/admin/equipo/soporte",
      stats: [
        { label: "Abiertos", value: ticketCount("open") },
        { label: "Esperando a la cuenta", value: ticketCount("waiting") },
        { label: "Cerrados este mes", value: ticketsClosedMonth },
      ],
      empty: "No hay tickets pendientes. 🎉",
      items: recentTickets.map((t) => ({
        id: t.id,
        href: `/admin/equipo/soporte/${t.id}`,
        title: `#${t.number} ${t.subject}`,
        meta: `${t.creator.name} · ${t.status === "open" ? "abierto" : "esperando"} · ${ago(t.lastActivityAt)}`,
        urgent: t.status === "open" && Date.now() - t.lastActivityAt.getTime() > DAY,
      })),
    },
    {
      role: "growth" as const,
      title: "💡 Centro de sugerencias",
      text: "Ideas de las cuentas para mejorar Foliocrew e ideas del equipo. Cuando una se planea o se lanza, la cuenta recibe un correo.",
      href: "/admin/equipo/ideas",
      stats: IDEA_STATUS.filter((s) => s.id !== "declined").map((s) => ({ label: s.label, value: ideaCount(s.id) })),
      empty: "No hay sugerencias por revisar.",
      items: recentIdeas.map((i) => ({
        id: i.id,
        href: "/admin/equipo/ideas",
        title: i.title,
        meta: `${i.creatorId ? i.authorName || i.authorEmail : "Idea del equipo"} · ${ago(i.createdAt)}`,
        urgent: false,
      })),
    },
    {
      role: "data" as const,
      title: "🛟 Recuperación de datos",
      text: "Pedidos de copia, recuperación o borrado de datos de una cuenta. Cada copia que saca el equipo queda registrada y la cuenta la ve.",
      href: "/admin/equipo/datos",
      stats: [
        { label: "Pedidos abiertos", value: dataOpen },
        { label: "Resueltos este mes", value: dataDoneMonth },
      ],
      empty: "No hay pedidos de datos abiertos.",
      items: recentData.map((d) => ({
        id: d.id,
        href: "/admin/equipo/datos",
        title: dataRequestKindLabel(d.kind),
        meta: `${d.creator.name} · ${ago(d.createdAt)}`,
        urgent: d.kind === "delete" || Date.now() - d.createdAt.getTime() > 2 * DAY,
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
                Abrir departamento →
              </Link>
            </div>

            <div className="mt-sp-4 grid grid-cols-2 gap-sp-3 md:grid-cols-4">
              {d.stats.map((s) => (
                <Stat key={s.label} label={s.label} value={String(s.value)} />
              ))}
            </div>

            <div className="mt-sp-5 grid gap-sp-5 md:grid-cols-[2fr_1fr]">
              <div>
                <p className={`${eyebrowClass} mb-sp-2`}>Para atender</p>
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
                <p className={`${eyebrowClass} mb-sp-2`}>Quién atiende</p>
                <ul className="flex flex-col gap-sp-1 text-sm">
                  {people.map((p) => (
                    <li key={p.key} className="flex flex-wrap items-center gap-sp-1">
                      <span className="text-ink">{p.name}</span>
                      {p.owner && <span className="rounded-full bg-ink px-[6px] py-px font-mono text-[9px] uppercase text-cream">Dueño</span>}
                    </li>
                  ))}
                </ul>
                <p className="mt-sp-2 text-xs text-ink/50">{role?.hint}</p>
                <Link href="/admin/equipo/personas" className="mt-sp-2 inline-block text-xs font-semibold text-coral hover:underline">
                  Sumar a alguien →
                </Link>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
