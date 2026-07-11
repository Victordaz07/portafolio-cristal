import { prisma } from "@/lib/prisma";
import MessagesManager from "./MessagesManager";

export default async function AdminMensajesPage() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink mb-sp-2">
        Mensajes recibidos
      </h1>
      <p className="font-mono text-xs uppercase tracking-wide text-moss mb-sp-6">
        {messages.length} mensajes
      </p>
      <MessagesManager initialMessages={messages} />
    </div>
  );
}
