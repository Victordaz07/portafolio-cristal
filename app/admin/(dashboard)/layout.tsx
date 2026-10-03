import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/ToastContext";
import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { sessionCreatorSite } from "@/lib/site-url";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { emailConfigured } from "@/lib/email";
import EmailVerifyNotice from "@/components/admin/EmailVerifyNotice";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";
import { redirect } from "next/navigation";
import Link from "next/link";
import { billingState } from "@/lib/billing";

// El panel lee siempre el estado más reciente de la base de datos: nunca debe
// servirse una versión prerenderizada en build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Panel — Foliocrew", robots: { index: false } };

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  // Sesión vencida o cerrada desde otro equipo (cambio de contraseña): de vuelta al login.
  if (!session) redirect("/admin/login");
  const [unreadMessages, creator, site, platformAdmin, user] = await Promise.all([
    prisma.contactMessage.count({ where: { read: false } }),
    prismaRoot.creator.findUnique({
      where: { id: session.creatorId },
      select: { name: true, plan: true, comp: true, trialEndsAt: true, paidUntil: true },
    }),
    sessionCreatorSite(),
    isPlatformAdmin(),
    prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { email: true, emailVerifiedAt: true } }),
  ]);
  const billing = creator ? billingState(creator) : null;
  const billingNotice =
    billing && (billing.state === "expired" || billing.state === "none")
      ? "Tu plan venció. Renueva para seguir usando Foliocrew sin cortes."
      : billing?.state === "trial" && (billing.daysLeft ?? 99) <= 3
        ? `Tu prueba gratis termina en ${billing.daysLeft} ${billing.daysLeft === 1 ? "día" : "días"}.`
        : billing?.state === "active" && (billing.daysLeft ?? 99) <= 5
          ? `Tu plan vence en ${billing.daysLeft} ${billing.daysLeft === 1 ? "día" : "días"}.`
          : null;
  const needsVerification = Boolean(user && !user.emailVerifiedAt && emailConfigured() && !session.actorId);

  return (
    <ToastProvider>
      <AdminShell unreadMessages={unreadMessages} creatorName={creator?.name ?? ""} siteUrl={site?.url ?? "/"} platformAdmin={platformAdmin}>
        {session.actorId && <ImpersonationBanner creatorName={creator?.name ?? ""} />}
        {billingNotice && (
          <div role="status" className="mb-sp-4 flex flex-wrap items-center justify-between gap-sp-3 rounded-[14px] border border-coral/30 bg-coral/5 px-sp-4 py-sp-3 text-sm text-ink">
            <p>
              <strong>{billingNotice}</strong> Paga por PayPal o transferencia.
            </p>
            <Link href="/admin/plan" className="rounded-full bg-ink px-sp-4 py-1.5 text-xs font-semibold text-cream hover:bg-coral">
              Ver cómo pagar
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
