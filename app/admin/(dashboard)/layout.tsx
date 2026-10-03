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
    prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { name: true } }),
    sessionCreatorSite(),
    isPlatformAdmin(),
    prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { email: true, emailVerifiedAt: true } }),
  ]);
  const needsVerification = Boolean(user && !user.emailVerifiedAt && emailConfigured() && !session.actorId);

  return (
    <ToastProvider>
      <AdminShell unreadMessages={unreadMessages} creatorName={creator?.name ?? ""} siteUrl={site?.url ?? "/"} platformAdmin={platformAdmin}>
        {session.actorId && <ImpersonationBanner creatorName={creator?.name ?? ""} />}
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
