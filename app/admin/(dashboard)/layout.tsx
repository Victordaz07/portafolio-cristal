import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/ToastContext";
import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { sessionCreatorSite } from "@/lib/site-url";

// El panel lee siempre el estado más reciente de la base de datos: nunca debe
// servirse una versión prerenderizada en build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Panel — Foliocrew", robots: { index: false } };

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const [unreadMessages, creator, site] = await Promise.all([
    prisma.contactMessage.count({ where: { read: false } }),
    session ? prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { name: true } }) : null,
    sessionCreatorSite(),
  ]);

  return (
    <ToastProvider>
      <AdminShell unreadMessages={unreadMessages} creatorName={creator?.name ?? ""} siteUrl={site?.url ?? "/"}>{children}</AdminShell>
    </ToastProvider>
  );
}
