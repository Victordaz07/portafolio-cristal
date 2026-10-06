import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { displayStatus } from "@/lib/invoices";
import { notifyCreatorAboutInvoice } from "@/lib/invoices-server";
import { tooManyAttempts } from "@/lib/rate-limit";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import InvoicePublicActions from "./InvoicePublicActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Factura · Invoice",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Página pública de una factura: la abre la marca con el enlace del correo (sin iniciar sesión). */
export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) notFound();
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (tooManyAttempts(`invoice-page:${ip}`, 60, 60_000)) notFound();

  const invoice = await prismaRoot.invoice.findUnique({ where: { publicToken: token } });
  if (!invoice) notFound();
  const session = await getSession();
  const isOwner = session?.creatorId === invoice.creatorId;
  // Un borrador solo lo ve su creador (vista previa).
  if (invoice.status === "draft" && !isOwner) notFound();

  // La primera vez que la abre alguien que no es el creador: queda "vista" y se le avisa.
  if (!isOwner && invoice.status === "sent" && !invoice.viewedAt) {
    const marked = await prismaRoot.invoice.updateMany({ where: { id: invoice.id, viewedAt: null }, data: { viewedAt: new Date() } });
    if (marked.count) await notifyCreatorAboutInvoice("viewed", invoice);
  }

  const lang = invoice.language === "en" ? "en" : "es";
  const status = displayStatus(invoice);
  return (
    <main className="min-h-screen bg-cream px-sp-4 py-sp-6 sm:py-sp-10 print:bg-white print:p-0">
      {isOwner && invoice.status === "draft" && (
        <p className="mx-auto mb-sp-4 max-w-3xl rounded-[12px] bg-coral/10 px-sp-4 py-sp-2 text-sm text-ink print:hidden">
          {lang === "en" ? "Preview: this invoice is still a draft. The brand can't see it until you send it." : "Vista previa: esta factura todavía es un borrador. La marca no la ve hasta que la envíes."}
        </p>
      )}
      <InvoicePublicActions token={token} lang={lang} canClaim={!isOwner && invoice.status === "sent"} claimed={Boolean(invoice.claimedPaidAt)} />
      <InvoiceDocument invoice={invoice} status={status} />
      <p className="mx-auto mt-sp-4 max-w-3xl text-center text-[11px] text-ink/40 print:hidden">
        {lang === "en" ? "Invoice created with Foliocrew" : "Factura creada con Foliocrew"}
      </p>
    </main>
  );
}
