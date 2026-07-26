import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import MessagesManager from "./MessagesManager";

export default async function AdminMensajesPage() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader eyebrow={`${messages.length} mensajes`} title="Mensajes recibidos" />
      <MessagesManager initialMessages={messages} />
    </div>
  );
}
