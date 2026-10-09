import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser } from "@/lib/agency";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import ClientActions from "./ClientActions";

export default async function AgencyClientPage({ params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;
  const agency = await agencyUser();
  if (!agency) return null;
  const creator = await prismaRoot.creator.findUnique({ where: { id: creatorId }, select: { id: true, name: true, slug: true, agencyId: true, status: true, createdAt: true } });
  if (!creator || creator.agencyId !== agency.agencyId) notFound();
  const owner = await prismaRoot.adminUser.findFirst({ where: { creatorId }, select: { email: true } });

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Agencia" title={creator.name} description={`${creator.slug}.foliocrew.pro · ${owner?.email ?? "sin usuario"}`} />
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Acceso</p>
        <ClientActions creatorId={creator.id} />
      </Card>
    </div>
  );
}
