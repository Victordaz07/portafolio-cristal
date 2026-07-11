import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/ToastContext";

// El panel lee siempre el estado más reciente de la base de datos: nunca debe
// servirse una versión prerenderizada en build.
export const dynamic = "force-dynamic";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AdminShell>{children}</AdminShell>
    </ToastProvider>
  );
}
