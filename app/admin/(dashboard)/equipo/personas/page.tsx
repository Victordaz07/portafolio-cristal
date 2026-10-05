import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import PageHeader from "@/components/admin/PageHeader";
import { adminEmails } from "@/lib/platform-admin";
import { requireOwner } from "@/lib/team";
import TeamMembersManager from "./TeamMembersManager";

export const dynamic = "force-dynamic";

export default async function TeamMembersPage() {
  const owner = await requireOwner();
  if (!owner) notFound();
  const members = await prismaRoot.teamMember.findMany({ orderBy: { createdAt: "asc" } });
  const emails = [...adminEmails(), ...members.map((m) => m.email)];
  const accounts = await prismaRoot.adminUser.findMany({
    where: { email: { in: emails } },
    select: { email: true, name: true, creator: { select: { name: true } } },
  });
  const accountFor = (email: string) => accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow="Equipo Foliocrew"
        title="Personas del equipo"
        description="Cada persona entra con su propia cuenta de Foliocrew (el mismo correo). Los roles deciden qué centros ve. Todo queda registrado."
      />
      <TeamMembersManager
        owners={adminEmails().map((email) => ({ email, account: accountFor(email)?.creator?.name ?? null }))}
        members={members.map((m) => ({
          id: m.id,
          email: m.email,
          name: m.name,
          roles: m.roles,
          active: m.active,
          account: accountFor(m.email)?.creator?.name ?? null,
        }))}
      />
    </div>
  );
}
