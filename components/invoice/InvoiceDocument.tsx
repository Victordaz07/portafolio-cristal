import { formatCents, parseItems, parseParty, type InvoiceDisplayStatus } from "@/lib/invoices";
import LinkifiedText from "@/components/community/LinkifiedText";

export type InvoiceDocData = {
  number: string;
  kind: string;
  currency: string;
  items: unknown;
  subtotal: number;
  notes: string;
  payTo: string;
  billTo: unknown;
  issuer: unknown;
  language: string;
  issuedAt: Date;
  dueAt: Date;
};

const COPY = {
  es: {
    full: "Factura",
    deposit: "Factura de anticipo",
    balance: "Factura de saldo",
    from: "De",
    to: "Para",
    issued: "Fecha",
    due: "Vence",
    description: "Descripción",
    qty: "Cant.",
    unit: "Precio",
    amount: "Importe",
    total: "Total a pagar",
    payTo: "Cómo pagar",
    notes: "Notas",
    paid: "PAGADA",
    void: "ANULADA",
    overdue: "VENCIDA",
  },
  en: {
    full: "Invoice",
    deposit: "Deposit invoice",
    balance: "Balance invoice",
    from: "From",
    to: "Bill to",
    issued: "Date",
    due: "Due",
    description: "Description",
    qty: "Qty",
    unit: "Price",
    amount: "Amount",
    total: "Total due",
    payTo: "How to pay",
    notes: "Notes",
    paid: "PAID",
    void: "VOID",
    overdue: "OVERDUE",
  },
};

/** La factura tal como la ve la marca (y se imprime o guarda como PDF). */
export default function InvoiceDocument({ invoice, status }: { invoice: InvoiceDocData; status?: InvoiceDisplayStatus }) {
  const lang = invoice.language === "en" ? "en" : "es";
  const c = COPY[lang];
  const money = (cents: number) => formatCents(cents, invoice.currency, lang);
  const date = (d: Date) => d.toLocaleDateString(lang === "en" ? "en-US" : "es-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const items = parseItems(invoice.items);
  const issuer = parseParty(invoice.issuer);
  const billTo = parseParty(invoice.billTo);
  const title = invoice.kind === "deposit" ? c.deposit : invoice.kind === "balance" ? c.balance : c.full;
  const stamp = status === "paid" ? c.paid : status === "void" ? c.void : status === "overdue" ? c.overdue : null;

  return (
    <article className="relative mx-auto w-full max-w-3xl rounded-[18px] border border-line bg-white p-sp-5 text-ink shadow-sm sm:p-sp-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
      {stamp && (
        <span
          className={`absolute right-sp-5 top-sp-5 rotate-6 rounded-md border-2 px-sp-3 py-1 font-mono text-sm font-bold tracking-widest sm:right-sp-8 sm:top-sp-8 ${
            status === "paid" ? "border-moss text-moss" : status === "overdue" ? "border-coral text-coral" : "border-ink/40 text-ink/50"
          }`}
        >
          {stamp}
        </span>
      )}
      <header className="flex flex-col gap-sp-4 border-b border-line pb-sp-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-coral">{title}</p>
          <h1 className="mt-1 font-fraunces text-3xl font-semibold">{invoice.number}</h1>
        </div>
        <dl className="grid grid-cols-2 gap-x-sp-5 gap-y-1 text-sm sm:text-right">
          <dt className="text-ink/55">{c.issued}</dt>
          <dd className="font-medium">{date(invoice.issuedAt)}</dd>
          <dt className="text-ink/55">{c.due}</dt>
          <dd className="font-semibold">{date(invoice.dueAt)}</dd>
        </dl>
      </header>

      <section className="grid gap-sp-5 py-sp-5 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">{c.from}</p>
          <p className="mt-1 font-semibold">{issuer.name || "—"}</p>
          {issuer.location && <p className="text-sm text-ink/70">{issuer.location}</p>}
          {issuer.email && <p className="text-sm text-ink/70">{issuer.email}</p>}
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">{c.to}</p>
          <p className="mt-1 font-semibold">{billTo.company || billTo.name || "—"}</p>
          {billTo.company && billTo.name && <p className="text-sm text-ink/70">{billTo.name}</p>}
          {billTo.email && <p className="text-sm text-ink/70">{billTo.email}</p>}
        </div>
      </section>

      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
              <th className="py-sp-2 pr-sp-2 font-normal">{c.description}</th>
              <th className="hidden py-sp-2 pr-sp-2 text-right font-normal sm:table-cell print:table-cell">{c.qty}</th>
              <th className="hidden py-sp-2 pr-sp-2 text-right font-normal sm:table-cell print:table-cell">{c.unit}</th>
              <th className="py-sp-2 text-right font-normal">{c.amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-line/70 align-top">
                <td className="py-sp-2 pr-sp-2">
                  {item.description}
                  <span className="block text-xs text-ink/55 sm:hidden print:hidden">
                    {item.quantity} × {money(item.unitAmount)}
                  </span>
                </td>
                <td className="hidden py-sp-2 pr-sp-2 text-right tabular-nums sm:table-cell print:table-cell">{item.quantity}</td>
                <td className="hidden py-sp-2 pr-sp-2 text-right tabular-nums sm:table-cell print:table-cell">{money(item.unitAmount)}</td>
                <td className="py-sp-2 text-right font-medium tabular-nums">{money(Math.round(item.quantity * item.unitAmount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-sp-4 flex justify-end">
        <div className="rounded-[12px] bg-cream px-sp-4 py-sp-3 text-right print:bg-transparent print:px-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/55">{c.total}</p>
          <p className="font-fraunces text-3xl font-semibold tabular-nums">{money(invoice.subtotal)}</p>
          <p className="text-[11px] text-ink/45">{invoice.currency}</p>
        </div>
      </div>

      {(invoice.payTo || invoice.notes) && (
        <section className="mt-sp-5 grid gap-sp-4 border-t border-line pt-sp-5 sm:grid-cols-2">
          {invoice.payTo && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">{c.payTo}</p>
              <LinkifiedText text={invoice.payTo} className="mt-1 text-sm" />
            </div>
          )}
          {invoice.notes && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">{c.notes}</p>
              <LinkifiedText text={invoice.notes} className="mt-1 text-sm text-ink/75" />
            </div>
          )}
        </section>
      )}
    </article>
  );
}
