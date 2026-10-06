import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { TEAM_ROLES, hasRole, roleLabel, teamUser } from "@/lib/team";
import { dateLocale, type AdminLang } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

// Nombre legible de cada acción del registro.
const ACTIONS: Record<string, [string, string]> = {
  impersonate: ["Entró como", "Signed in as"],
  pause: ["Pausó", "Paused"],
  activate: ["Reactivó", "Reactivated"],
  note: ["Nota", "Note"],
  team: ["Equipo", "Team"],
  "data-export": ["Copia de datos", "Data export"],
  "data-request": ["Pedido de datos", "Data request"],
};

const fmt = (d: Date, lang: AdminLang) => d.toLocaleString(dateLocale(lang), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function TeamHubPage() {
  const { t, lang } = await getT();
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
      title: t("🎧 Centro de ayuda", "🎧 Help center"),
      stat: t(`${openTickets} abiertos · ${waitingTickets} esperando a la cuenta`, `${openTickets} open · ${waitingTickets} waiting for the account`),
      text: t("Tickets de las cuentas: responde, agrega notas internas y entra a una cuenta para ayudar.", "Account tickets: reply, add internal notes and sign in to an account to help."),
    },
    {
      role: "growth" as const,
      href: "/admin/equipo/ideas",
      title: t("💡 Centro de sugerencias", "💡 Suggestions center"),
      stat: t(`${newIdeas} sugerencias nuevas`, `${newIdeas} new suggestions`),
      text: t("Sugerencias de las cuentas e ideas del equipo: revísalas, planéalas y avisa cuando estén listas.", "Account suggestions and team ideas: review them, plan them and let people know when they're ready."),
    },
    {
      role: "data" as const,
      href: "/admin/equipo/datos",
      title: t("🛟 Recuperación de datos", "🛟 Data recovery"),
      stat: t(`${openData} pedidos abiertos`, `${openData} open requests`),
      text: t("Pedidos de copia, recuperación o borrado de datos, y exportación de una cuenta.", "Requests for data copies, recovery or deletion, and account exports."),
    },
  ].filter((c) => hasRole(user, c.role));

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Equipo Foliocrew", "Foliocrew team")}
        title={t("Centro del equipo", "Team hub")}
        description={
          user.owner
            ? t("Eres Dueño: ves todos los centros y administras quién forma parte del equipo.", "You're the Owner: you see every center and manage who's on the team.")
            : t(`Tus roles: ${user.roles.map((r) => roleLabel(r)).join(", ")}.`, `Your roles: ${user.roles.map((r) => roleLabel(r, "en")).join(", ")}.`)
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
              <p className="font-semibold text-ink">{t("👥 Personas del equipo", "👥 Team members")}</p>
              <p className="text-sm text-ink/70">
                {t(`${members} con acceso activo. Roles:`, `${members} with active access. Roles:`)} {TEAM_ROLES.map((r) => roleLabel(r.id, lang)).join(", ")}.
              </p>
            </div>
            <Link href="/admin/equipo/personas" className="rounded-full bg-ink px-sp-4 py-2 text-sm font-semibold text-cream hover:bg-coral">
              {t("Administrar equipo", "Manage team")}
            </Link>
          </div>
        </Card>
      )}

      {user.owner && activity.length > 0 && (
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Registro de actividad", "Activity log")}</p>
          <ul className="flex flex-col gap-sp-2 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-sp-2 border-t border-line pt-sp-2 first:border-0 first:pt-0">
                <span className="font-mono text-xs text-ink/50">{fmt(a.createdAt, lang)}</span>
                <span className="font-semibold text-ink">{a.actorEmail}</span>
                <span className="text-ink/70">
                  {ACTIONS[a.action] ? t(...ACTIONS[a.action]) : a.action}
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
