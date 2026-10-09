import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/ToastContext";
import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { sessionCreatorSite } from "@/lib/site-url";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { hasRole, teamUser } from "@/lib/team";
import { emailConfigured } from "@/lib/email";
import EmailVerifyNotice from "@/components/admin/EmailVerifyNotice";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";
import AgencyEnterBanner from "@/components/admin/AgencyEnterBanner";
import { redirect } from "next/navigation";
import Link from "next/link";
import { billingState } from "@/lib/billing";
import { getT } from "@/lib/admin-lang-server";
import { plural } from "@/lib/admin-lang";
import { newRepliesCount } from "@/lib/community-moderation";
import { pendingIncomingCount } from "@/lib/community-connections";
import { unreadConversationsCount } from "@/lib/community-messages";
import { meritEnabled } from "@/lib/ambassadors";

// El panel lee siempre el estado más reciente de la base de datos: nunca debe
// servirse una versión prerenderizada en build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Foliocrew", robots: { index: false } };

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  // Sesión vencida o cerrada desde otro equipo (cambio de contraseña): de vuelta al login.
  if (!session) redirect("/admin/login");
  const [unreadMessages, creator, site, platformAdmin, user, team, supportUnread, actor] = await Promise.all([
    prisma.contactMessage.count({ where: { read: false } }),
    prismaRoot.creator.findUnique({
      where: { id: session.creatorId },
      select: { name: true, plan: true, comp: true, ambassador: true, trialEndsAt: true, paidUntil: true, agencyId: true },
    }),
    sessionCreatorSite(),
    isPlatformAdmin(),
    prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { email: true, emailVerifiedAt: true } }),
    teamUser(),
    prisma.supportTicket.count({ where: { unreadByCustomer: true } }).catch(() => 0),
    session.actorId ? prismaRoot.adminUser.findUnique({ where: { id: session.actorId }, select: { agencyId: true } }) : null,
  ]);
  // "Entrar como" puede venir del soporte de Foliocrew o de una agencia (plan Crew): distinto banner.
  const enteredByAgency = Boolean(session.actorId && actor?.agencyId);
  const [openTickets, openReports, communityNew, connectionRequests, unreadDms] = await Promise.all([
    hasRole(team, "support") ? prismaRoot.supportTicket.count({ where: { status: "open" } }) : 0,
    // Contenidos distintos con reportes abiertos (no el número de reportes).
    hasRole(team, "community")
      ? prismaRoot.communityReport.groupBy({ by: ["targetType", "targetId"], where: { status: "open" } }).then((g) => g.length)
      : 0,
    session && !session.actorId ? newRepliesCount(session.creatorId).catch(() => 0) : 0,
    session && !session.actorId ? pendingIncomingCount(session.creatorId).catch(() => 0) : 0,
    session && !session.actorId ? unreadConversationsCount(session.creatorId).catch(() => 0) : 0,
  ]);
  const { t, lang } = await getT();
  const days = (n: number) => plural(lang, n, ["día", "días"], ["day", "days"]);
  const billing = creator ? billingState(creator) : null;
  const billingNotice =
    billing && (billing.state === "expired" || billing.state === "none")
      ? t("Tu plan venció. Renueva para seguir usando Foliocrew sin cortes.", "Your plan expired. Renew to keep using Foliocrew without interruptions.")
      : billing?.state === "trial" && (billing.daysLeft ?? 99) <= 3
        ? t(`Tu prueba gratis termina en ${days(billing.daysLeft ?? 0)}.`, `Your free trial ends in ${days(billing.daysLeft ?? 0)}.`)
        : billing?.state === "active" && (billing.daysLeft ?? 99) <= 5
          ? t(`Tu plan vence en ${days(billing.daysLeft ?? 0)}.`, `Your plan expires in ${days(billing.daysLeft ?? 0)}.`)
          : null;
  const needsVerification = Boolean(user && !user.emailVerifiedAt && emailConfigured() && !session.actorId);

  return (
    <ToastProvider>
      <AdminShell unreadMessages={unreadMessages} creatorName={creator?.name ?? ""} siteUrl={site?.url ?? "/"} platformAdmin={platformAdmin}
        team={team ? { owner: team.owner, roles: team.roles } : null}
        supportUnread={supportUnread}
        openTickets={openTickets}
        openReports={openReports}
        communityNew={communityNew}
        connectionRequests={connectionRequests}
        unreadDms={unreadDms}
        ambassador={Boolean(creator?.ambassador)}
        ambassadorMerit={meritEnabled() && !creator?.ambassador}
        viaCode={session.via === "code"}
      >
        {session.actorId && (enteredByAgency ? <AgencyEnterBanner creatorName={creator?.name ?? ""} /> : <ImpersonationBanner creatorName={creator?.name ?? ""} />)}
        {billingNotice && (
          <div role="status" className="mb-sp-4 flex flex-wrap items-center justify-between gap-sp-3 rounded-[14px] border border-coral/30 bg-coral/5 px-sp-4 py-sp-3 text-sm text-ink">
            <p>
              <strong>{billingNotice}</strong> {t("Paga por PayPal o transferencia.", "Pay by PayPal or bank transfer.")}
            </p>
            <Link href="/admin/plan" className="rounded-full bg-ink px-sp-4 py-1.5 text-xs font-semibold text-cream hover:bg-coral">
              {t("Ver cómo pagar", "See how to pay")}
            </Link>
          </div>
        )}
        {needsVerification && user && (
          <div className="mb-sp-4">
            <EmailVerifyNotice email={user.email} compact />
          </div>
        )}
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
