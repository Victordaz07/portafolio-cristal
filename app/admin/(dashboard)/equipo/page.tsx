import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { TEAM_ROLES, hasRole, roleLabel, teamUser } from "@/lib/team";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function TeamHubPage() {
  const user = await teamUser();
  if (!user) notFound();

  const [openTickets, waitingTickets, newIdeas, openData, members, activity] = await Promise.all([
    hasRole(user, "support") ? prismaRoot.supportTicket.count({ where: { status: "open" } }) : 0,
    hasRole(user, "support") ? prismaRoot.supportTicket.count({ where: { status: "waiting" } }) : 0,
    hasRole(user, "growth") ? prismaRoot.idea.count({ where: { status: "new" } }) : 0,
    hasRole(user, "data") ? prismaRoot.dataRequest.count({ where: { status: "open" } }) : 0,
    user.owner ? prismaRoot.teamMember.count({ where: { active: true } }) : 0,
    user.owner ? prismaRoot.platformAction.findMany({ orderBy: { createdAt: "desc" }, take: 15 }) : [],
  ]);

  const centers = [
    {
      role: "support" as const,
      href: "/admin/equipo/soporte",
      title: "🎧 Centro de soporte",
      stat: `${openTickets} abiertos · ${waitingTickets} esperando a la cuenta`,
      text: "Tickets de las cuentas: responde, agrega notas internas y entra a una cuenta para ayudar.",
    },
    {
      role: "growth" as const,
      href: "/admin/equipo/ideas",
      title: "💡 Mejora continua",
      stat: `${newIdeas} sugerencias nuevas`,
      text: "Sugerencias de las cuentas e ideas del equipo: revísalas, planéalas y avisa cuando estén listas.",
    },
    {
      role: "data" as const,
      href: "/admin/equipo/datos",
      title: "🛟 Datos y recuperación",
      stat: `${openData} pedidos abiertos`,
      text: "Pedidos de copia, recuperación o borrado de datos, y exportación de una cuenta.",
    },
  ].filter((c) => hasRole(user, c.role));

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow="Equipo Foliocrew"
        title="Centro del equipo"
        description={
          user.owner
            ? "Eres Dueño: ves todos los centros y administras quién forma parte del equipo."
            : `Tus roles: ${user.roles.map(roleLabel).join(", ")}.`
        }
      />

      <div className="grid gap-sp-4 md:grid-cols-3">
        {centers.map((c) => (
          <Link key={c.href} href={c.href} className="block rounded-[18px] border border-line bg-white p-sp-5 transition hover:border-coral/40">
            <p className="font-semibold text-ink">{c.title}</p>
            <p className="mt-sp-1 font-mono text-[11px] uppercase tracking-[0.12em] text-coral">{c.stat}</p>
            <p className="mt-sp-2 text-sm text-ink/70">{c.text}</p>
          </Link>
        ))}
      </div>

      {user.owner && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-sp-3">
            <div>
              <p className="font-semibold text-ink">👥 Personas del equipo</p>
              <p className="text-sm text-ink/70">{members} con acceso activo. Roles: {TEAM_ROLES.map((r) => r.label).join(", ")}.</p>
            </div>
            <Link href="/admin/equipo/personas" className="rounded-full bg-ink px-sp-4 py-2 text-sm font-semibold text-cream hover:bg-coral">
              Administrar equipo
            </Link>
          </div>
        </Card>
      )}

      {user.owner && activity.length > 0 && (
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Registro de actividad</p>
          <ul className="flex flex-col gap-sp-2 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-sp-2 border-t border-line pt-sp-2 first:border-0 first:pt-0">
                <span className="font-mono text-xs text-ink/50">{fmt(a.createdAt)}</span>
                <span className="font-semibold text-ink">{a.actorEmail}</span>
                <span className="text-ink/70">
                  {a.action}
                  {a.detail ? ` · ${a.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
