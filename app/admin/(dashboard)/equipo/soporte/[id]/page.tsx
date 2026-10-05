import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import SupportThread from "@/components/admin/support/SupportThread";
import ReplyBox from "@/components/admin/support/ReplyBox";
import { SUPPORT_STATUS_TEAM, supportCategoryLabel } from "@/lib/support";
import { getPlan, billingState, billingLabel } from "@/lib/billing";
import { dateLocale, pickLabel, type AdminLang } from "@/lib/admin-lang";
import { requireRole } from "@/lib/team";
import TeamTicketControls from "./TeamTicketControls";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const fmt = (d: Date, lang: AdminLang) => d.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short", year: "numeric" });

export default async function TeamTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const user = await requireRole("support");
  if (!user) notFound();
  const { id } = await params;
  const ticket = await prismaRoot.supportTicket.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      creator: { select: { id: true, name: true, slug: true, status: true, plan: true, comp: true, trialEndsAt: true, paidUntil: true, createdAt: true } },
    },
  });
  if (!ticket) notFound();
  const { creator } = ticket;
  const otherTickets = await prismaRoot.supportTicket.count({ where: { creatorId: creator.id, id: { not: ticket.id } } });
  const billing = billingState(creator);

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t(`Centro de ayuda · Ticket #${ticket.number}`, `Help center · Ticket #${ticket.number}`)}
        title={ticket.subject}
        description={`${supportCategoryLabel(ticket.category, lang)} · ${
          SUPPORT_STATUS_TEAM[ticket.status] ? pickLabel(lang, SUPPORT_STATUS_TEAM[ticket.status]) : ticket.status
        } · ${t("De", "From")} ${ticket.authorName ? `${ticket.authorName} (${ticket.authorEmail})` : ticket.authorEmail}`}
        action={
          <Link href="/admin/equipo/soporte" className="text-sm font-medium text-coral hover:underline">
            {t("← Todos los tickets", "← All tickets")}
          </Link>
        }
      />
      <div className="grid gap-sp-5 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-sp-5">
          <Card>
            <SupportThread messages={ticket.messages} viewer="team" lang={lang} />
          </Card>
          <Card>
            <ReplyBox url={`/api/admin/team/support/${ticket.id}`} allowInternal placeholder={t("Respuesta para la cuenta (le llega por correo)…", "Reply to the account (it reaches them by email)…")} />
          </Card>
        </div>
        <div className="flex flex-col gap-sp-5">
          <Card>
            <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Cuenta", "Account")}</p>
            <p className="font-semibold text-ink">{creator.name}</p>
            <ul className="mt-sp-2 flex flex-col gap-1 text-sm text-ink/70">
              <li>
                {t("Dirección", "Address")}: /s/{creator.slug}
              </li>
              <li>
                {t("Plan", "Plan")}: {creator.comp ? t("Cortesía", "Complimentary") : getPlan(creator.plan).name} · {billingLabel(billing.state, lang)}
              </li>
              <li>
                {t("Estado", "Status")}: {creator.status === "active" ? t("Activa", "Active") : t("Pausada", "Paused")}
              </li>
              <li>
                {t("Desde", "Since")}: {fmt(creator.createdAt, lang)}
              </li>
              <li>
                {t("Otros tickets", "Other tickets")}: {otherTickets}
              </li>
            </ul>
            {user.owner && (
              <Link href={`/admin/plataforma/${creator.id}`} className="mt-sp-2 inline-block text-sm text-coral hover:underline">
                {t("Ver en el Centro de mando →", "View in the Command center →")}
              </Link>
            )}
          </Card>
          <Card>
            <TeamTicketControls
              id={ticket.id}
              number={ticket.number}
              status={ticket.status}
              assignedTo={ticket.assignedTo}
              me={user.email}
              creatorId={creator.id}
              accountName={creator.name}
              canImpersonate={creator.id !== user.creatorId}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
