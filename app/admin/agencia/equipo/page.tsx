import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser } from "@/lib/agency";
import PageHeader from "@/components/admin/PageHeader";
import AgencyTeamManager from "./AgencyTeamManager";

export default async function AgencyTeamPage() {
  const agency = await agencyUser();
  if (!agency) return null;
  const members = await prismaRoot.adminUser.findMany({
    where: { agencyId: agency.agencyId },
    select: { id: true, email: true, name: true, agencyRole: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Agencia" title="Tu equipo" description="Quién puede entrar a las cuentas de tu cartera." />
      <AgencyTeamManager members={members.map((m) => ({ id: m.id, email: m.email, name: m.name, role: (m.agencyRole as "owner" | "cm") ?? "cm" }))} selfId={agency.id} />
    </div>
  );
}
