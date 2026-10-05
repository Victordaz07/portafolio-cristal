import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { sessionCreatorSite } from "@/lib/site-url";
import InboxManager from "./MessagesManager";
import { getT } from "@/lib/admin-lang-server";

export default async function AdminMensajesPage() {
  const { t } = await getT();
  const [messages, brands, instagram, hero] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.brand.findMany({ select: { name: true } }),
    prisma.socialAccount.findFirst({ where: { platform: "instagram" }, select: { username: true } }),
    prisma.hero.findFirst({ select: { name: true } }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow={t("Negocio", "Business")}
        title={t("Bandeja", "Inbox")}
        description={
          instagram
            ? t("Mensajes del formulario y comentarios de Instagram en un solo lugar.", "Contact form messages and Instagram comments in one place.")
            : t("Mensajes del formulario en un solo lugar.", "Contact form messages in one place.")
        }
      />
      <InboxManager
        initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString(), repliedAt: m.repliedAt?.toISOString() ?? null }))}
        brandNames={brands.map((b) => b.name)}
        instagramUsername={instagram ? instagram.username ?? "" : null}
        signature={(hero?.name ?? "").split(" ")[0] || ""}
        mediaKitUrl={`${(await sessionCreatorSite())?.url ?? ""}/media-kit`}
      />
    </div>
  );
}
