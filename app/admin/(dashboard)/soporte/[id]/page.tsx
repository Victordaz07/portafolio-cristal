import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, prismaRoot } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import SupportThread from "@/components/admin/support/SupportThread";
import ReplyBox from "@/components/admin/support/ReplyBox";
import { SUPPORT_STATUS, supportCategoryLabel } from "@/lib/support";
import CustomerTicketActions from "./CustomerTicketActions";
import { pickLabel } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

export default async function CustomerTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({ where: { id } });
  if (!ticket) notFound();
  const messages = await prismaRoot.supportMessage.findMany({ where: { ticketId: ticket.id, internal: false }, orderBy: { createdAt: "asc" } });
  // Al abrirlo, la respuesta nueva del equipo queda vista.
  if (ticket.unreadByCustomer) await prismaRoot.supportTicket.update({ where: { id: ticket.id }, data: { unreadByCustomer: false } });
  const status = SUPPORT_STATUS[ticket.status] ?? SUPPORT_STATUS.open;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t(`Soporte · Ticket #${ticket.number}`, `Support · Ticket #${ticket.number}`)}
        title={ticket.subject}
        description={`${supportCategoryLabel(ticket.category, lang)} · ${pickLabel(lang, status)}`}
        action={
          <Link href="/admin/soporte" className="text-sm font-medium text-coral hover:underline">
            {t("← Todos mis tickets", "← All my tickets")}
          </Link>
        }
      />
      <Card>
        <SupportThread messages={messages} viewer="customer" lang={lang} />
      </Card>
      <Card>
        {ticket.status === "closed" ? (
          <p className="mb-sp-3 text-sm text-ink/70">{t("Este ticket está cerrado. Si vuelve a pasar, escribe aquí y se reabre.", "This ticket is closed. If it happens again, write here and it will reopen.")}</p>
        ) : null}
        <ReplyBox url={`/api/admin/support/${ticket.id}`} />
        <div className="mt-sp-4 border-t border-line pt-sp-4">
          <CustomerTicketActions id={ticket.id} closed={ticket.status === "closed"} />
        </div>
      </Card>
    </div>
  );
}
