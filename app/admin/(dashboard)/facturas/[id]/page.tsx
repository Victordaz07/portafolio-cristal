import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { pickLabel } from "@/lib/admin-lang";
import { dateToInput, formatShortDate } from "@/lib/crm";
import { INVOICE_STATUS_META, displayStatus, parseItems, parseParty, type InvoiceKind } from "@/lib/invoices";
import { invoiceLink } from "@/lib/invoices-server";
import { platformOrigin } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import InvoiceEditor from "../InvoiceEditor";
import InvoiceAdminActions from "./InvoiceAdminActions";

export const dynamic = "force-dynamic";

const dollars = (cents: number) => (cents / 100).toFixed(cents % 100 ? 2 : 0);

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getT();
  const { id } = await params;
  const [invoice, session, origin] = await Promise.all([prisma.invoice.findUnique({ where: { id }, include: { brand: { select: { id: true, name: true } } } }), getSession(), platformOrigin()]);
  if (!invoice) notFound();
  const status = displayStatus(invoice);
  const billTo = parseParty(invoice.billTo);
  const brands = invoice.status === "draft" ? await prisma.brand.findMany({ where: { dealStatus: { not: null } }, orderBy: { name: "asc" }, select: { id: true, name: true } }) : [];

  const timeline = [
    { at: invoice.createdAt, text: t("Creada", "Created") },
    invoice.sentAt && { at: invoice.sentAt, text: t("Enviada a la marca", "Sent to the brand") },
    invoice.viewedAt && { at: invoice.viewedAt, text: t("La marca la abrió", "The brand opened it") },
    invoice.remindersSent > 0 && invoice.lastReminderAt && {
      at: invoice.lastReminderAt,
      text: t(`Recordatorios enviados: ${invoice.remindersSent} de 3`, `Reminders sent: ${invoice.remindersSent} of 3`),
    },
    invoice.claimedPaidAt && { at: invoice.claimedPaidAt, text: t("La marca dice que ya pagó: revisa tu cuenta y confírmalo", "The brand says they paid: check your account and confirm it") },
    invoice.paidAt && { at: invoice.paidAt, text: t("Pagada 🎉", "Paid 🎉") },
  ].filter((x): x is { at: Date; text: string } => Boolean(x));

  return (
    <div className="flex flex-col gap-sp-5">
      <Link href="/admin/facturas" className="text-sm font-medium text-coral hover:underline">
        {t("← Facturas", "← Invoices")}
      </Link>
      <PageHeader
        eyebrow={invoice.brand ? `${t("Factura", "Invoice")} · ${invoice.brand.name}` : t("Factura", "Invoice")}
        title={invoice.number}
        action={<span className={`rounded-full px-sp-3 py-1 font-mono text-[11px] uppercase ${INVOICE_STATUS_META[status].className}`}>{pickLabel(lang, INVOICE_STATUS_META[status])}</span>}
      />

      {invoice.claimedPaidAt && invoice.status === "sent" && (
        <p className="rounded-[14px] bg-lime/30 px-sp-4 py-sp-3 text-sm font-semibold text-moss">
          {t("💸 La marca dice que ya pagó. Cuando lo veas en tu cuenta, toca «Marcar pagada».", "💸 The brand says they paid. When you see it in your account, tap “Mark as paid”.")}
        </p>
      )}

      <InvoiceAdminActions id={invoice.id} status={invoice.status} link={invoiceLink(origin, invoice.publicToken)} hasEmail={Boolean(billTo.email)} readOnly={Boolean(session?.actorId)} />

      {invoice.status === "draft" && !session?.actorId && (
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Editar borrador", "Edit draft")}</p>
          <InvoiceEditor
            invoiceId={invoice.id}
            brands={brands}
            initial={{
              brandId: invoice.brandId ?? "",
              kind: invoice.kind as InvoiceKind,
              currency: invoice.currency,
              language: invoice.language === "en" ? "en" : "es",
              billName: billTo.name,
              billCompany: billTo.company ?? "",
              billEmail: billTo.email ?? "",
              issuedAt: dateToInput(invoice.issuedAt),
              dueAt: dateToInput(invoice.dueAt),
              items: parseItems(invoice.items).map((i) => ({ description: i.description, quantity: String(i.quantity), amount: dollars(i.unitAmount) })),
              notes: invoice.notes,
              payTo: invoice.payTo,
            }}
          />
        </Card>
      )}

      <div className="grid gap-sp-5 lg:grid-cols-[1fr_260px]">
        <InvoiceDocument invoice={invoice} status={status} />
        <Card className="h-fit">
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Historial", "History")}</p>
          <ul className="flex flex-col gap-sp-2 text-sm">
            {timeline.map((e) => (
              <li key={e.text} className="flex gap-sp-2">
                <span className="w-14 shrink-0 font-mono text-[11px] text-ink/50">{formatShortDate(e.at, lang)}</span>
                <span className="text-ink/80">{e.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
