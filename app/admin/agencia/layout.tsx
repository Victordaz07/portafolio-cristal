import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser } from "@/lib/agency";
import { ToastProvider } from "@/components/admin/ToastContext";
import AgencyShell from "@/components/admin/AgencyShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Foliocrew", robots: { index: false } };

export default async function AgencyLayout({ children }: { children: ReactNode }) {
  const agency = await agencyUser();
  if (!agency) redirect("/admin");
  const record = await prismaRoot.agency.findUnique({ where: { id: agency.agencyId }, select: { name: true } });

  return (
    <ToastProvider>
      <AgencyShell agencyName={record?.name ?? "Agencia"}>{children}</AgencyShell>
    </ToastProvider>
  );
}
