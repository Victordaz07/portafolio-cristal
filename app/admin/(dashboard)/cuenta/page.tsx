import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession, platformRootDomain } from "@/lib/tenant";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const session = await getSession();
  const [user, creator] = session
    ? await Promise.all([
        prisma.adminUser.findUnique({ where: { id: session.userId }, select: { name: true, email: true } }),
        prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { name: true, slug: true, customDomain: true } }),
      ])
    : [null, null];
  const siteUrl = creator ? `https://${creator.slug}.${platformRootDomain()}` : "";

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Ayuda" title="Mi cuenta" description="Tus datos de acceso y la dirección de tu sitio." />
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Tu sitio</p>
        <p className="font-mono text-sm text-ink">{siteUrl.replace("https://", "")}</p>
        <p className="mt-sp-1 text-xs text-ink/55">
          Tu dirección en Foliocrew. Funciona en cuanto el dominio de la plataforma esté configurado; más adelante podrás
          conectar tu propio dominio{creator?.customDomain ? ` (ahora: ${creator.customDomain})` : ""}.
        </p>
      </Card>
      <AccountForm initialName={user?.name ?? creator?.name ?? ""} email={user?.email ?? ""} />
    </div>
  );
}
