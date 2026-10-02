import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { getPublicAppUrl } from "@/lib/site-config";
import InboxManager from "./MessagesManager";

export default async function AdminMensajesPage() {
  const [messages, brands, instagram, hero] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.brand.findMany({ select: { name: true } }),
    prisma.socialAccount.findFirst({ where: { platform: "instagram" }, select: { username: true } }),
    prisma.hero.findFirst({ select: { name: true } }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Negocio"
        title="Bandeja"
        description={`Mensajes del formulario${instagram ? " y comentarios de Instagram" : ""} en un solo lugar.`}
      />
      <InboxManager
        initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString(), repliedAt: m.repliedAt?.toISOString() ?? null }))}
        brandNames={brands.map((b) => b.name)}
        instagramUsername={instagram ? instagram.username ?? "" : null}
        signature={(hero?.name ?? "").split(" ")[0] || ""}
        mediaKitUrl={`${getPublicAppUrl()}/media-kit`}
      />
    </div>
  );
}
