import { prisma, prismaRoot } from "@/lib/prisma";
import Link from "next/link";
import { getSession } from "@/lib/tenant";
import { sessionCreatorSite } from "@/lib/site-url";
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
  const siteUrl = (await sessionCreatorSite())?.url ?? "";

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Ayuda" title="Mi cuenta" description="Tus datos de acceso y la dirección de tu sitio." />
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Tu sitio</p>
        <p className="font-mono text-sm text-ink">{siteUrl.replace("https://", "")}</p>
        <p className="mt-sp-1 text-xs text-ink/55">
          Para conectar tu propio dominio o ver tus otras direcciones, ve a{" "}
          <Link href="/admin/dominio" className="font-semibold text-coral hover:underline">
            Mi dominio
          </Link>
          .
        </p>
      </Card>
      <AccountForm initialName={user?.name ?? creator?.name ?? ""} email={user?.email ?? ""} />
    </div>
  );
}
