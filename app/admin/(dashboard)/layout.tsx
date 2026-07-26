import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/ToastContext";
import { prisma } from "@/lib/prisma";

// El panel lee siempre el estado más reciente de la base de datos: nunca debe
// servirse una versión prerenderizada en build.
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const unreadMessages = await prisma.contactMessage.count({ where: { read: false } });

  return (
    <ToastProvider>
      <AdminShell unreadMessages={unreadMessages}>{children}</AdminShell>
    </ToastProvider>
  );
}
