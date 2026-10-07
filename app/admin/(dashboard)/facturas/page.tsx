import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { pickLabel } from "@/lib/admin-lang";
import { formatShortDate } from "@/lib/crm";
import { INVOICE_STATUS_META, displayStatus, formatCents, parseParty } from "@/lib/invoices";
import { getBillingProfile } from "@/lib/invoices-server";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import EmptyState from "@/components/admin/EmptyState";
import BillingProfileForm from "./BillingProfileForm";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const { t, lang } = await getT();
  const [invoices, profile] = await Promise.all([
    prisma.invoice.findMany({ orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }], take: 300, include: { brand: { select: { name: true } } } }),
    getBillingProfile(),
  ]);
  const now = new Date();
  const withStatus = invoices.map((inv) => ({ ...inv, display: displayStatus(inv, now) }));
  // Los totales se muestran en USD (la moneda más común); las de otra moneda no se suman.
  const usd = withStatus.filter((i) => i.currency === "USD");
  const sum = (list: typeof usd) => list.reduce((s, i) => s + i.subtotal, 0);
  const receivable = usd.filter((i) => i.status === "sent");
  const overdue = receivable.filter((i) => i.display === "overdue");
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const paidMonth = usd.filter((i) => i.status === "paid" && i.paidAt && i.paidAt >= monthStart);
  const claimed = withStatus.filter((i) => i.status === "sent" && i.claimedPaidAt);
  const profileReady = Boolean(profile.legalName && profile.payTo);

  const kpis = [
    { label: t("Por cobrar", "Receivable"), value: formatCents(sum(receivable), "USD", lang), sub: `${receivable.length} ${receivable.length === 1 ? t("factura", "invoice") : t("facturas", "invoices")}` },
    { label: t("Vencido", "Overdue"), value: formatCents(sum(overdue), "USD", lang), sub: `${overdue.length} ${overdue.length === 1 ? t("factura", "invoice") : t("facturas", "invoices")}`, alert: overdue.length > 0 },
    { label: t("Cobrado este mes", "Collected this month"), value: formatCents(sum(paidMonth), "USD", lang), sub: `${paidMonth.length} ${paidMonth.length === 1 ? t("factura", "invoice") : t("facturas", "invoices")}` },
  ];

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Negocio", "Business")}
        title={t("Facturas", "Invoices")}
        description={t(
          "Crea facturas para tus marcas, envíalas con un enlace y te avisamos cuando las ven. Si se atrasan, les recordamos con amabilidad.",
          "Create invoices for your brands, send them with a link and we'll let you know when they're viewed. If they're late, we remind them kindly."
        )}
        action={
          <Link href="/admin/facturas/nueva" className="rounded-full bg-ink px-sp-5 py-sp-2.5 text-sm font-semibold text-cream hover:bg-coral">
            {t("+ Nueva factura", "+ New invoice")}
          </Link>
        }
      />

      {!profileReady && (
        <p className="rounded-[14px] bg-coral/10 px-sp-4 py-sp-3 text-sm text-ink">
          {t("Para empezar, completa abajo tus datos para facturar: tu nombre y cómo te pagan.", "To start, fill in your billing details below: your name and how you get paid.")}
        </p>
      )}

      {withStatus.length > 0 && (
        <div className="grid grid-cols-1 gap-sp-3 sm:grid-cols-3">
          {kpis.map((k) => (
            <Card key={k.label}>
              <p className={`font-fraunces text-3xl font-semibold ${k.alert ? "text-coral" : "text-ink"}`}>{k.value}</p>
              <p className="mt-1 text-sm text-ink/70">{k.label}</p>
              <p className="text-xs text-ink/45">{k.sub}</p>
            </Card>
          ))}
        </div>
      )}

      {claimed.length > 0 && (
        <Card className="border-moss/40">
          <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-moss">{t("💸 Dicen que ya pagaron", "💸 They say they paid")}</p>
          <ul className="flex flex-col gap-1 text-sm">
            {claimed.map((i) => (
              <li key={i.id}>
                <Link href={`/admin/facturas/${i.id}`} className="font-semibold text-ink hover:text-coral">
                  {i.number}
                </Link>{" "}
                <span className="text-ink/60">
                  · {i.brand?.name ?? parseParty(i.billTo).company} · {formatCents(i.subtotal, i.currency, lang)} — {t("confírmalo cuando lo veas en tu cuenta", "confirm it when you see it in your account")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_1px_2px_rgba(36,18,39,0.04)]">
        {withStatus.length === 0 ? (
          <EmptyState
            title={t("Todavía no creaste ninguna factura", "No invoices yet")}
            description={t(
              "Cuando cierres un trato, manda la factura con un enlace: te avisamos cuando la marca la ve, y le recordamos con amabilidad si se atrasa.",
              "Once you close a deal, send the invoice with a link: we'll let you know when the brand views it, and kindly remind them if it's late."
            )}
            action={{ href: "/admin/facturas/nueva", label: t("+ Nueva factura", "+ New invoice") }}
            secondary={
              <>
                {t("O créala desde un trato en ", "Or create one from a deal in ")}
                <Link href="/admin/marcas" className="font-semibold text-coral hover:underline">
                  {t("Marcas", "Brands")}
                </Link>
                .
              </>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {withStatus.map((i) => {
              const meta = INVOICE_STATUS_META[i.display];
              return (
                <li key={i.id}>
                  <Link href={`/admin/facturas/${i.id}`} className="flex flex-wrap items-center gap-x-sp-3 gap-y-1 px-sp-4 py-sp-3 hover:bg-cream/60 sm:px-sp-5">
                    <span className="font-mono text-sm font-semibold text-ink">{i.number}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink/75">{i.brand?.name ?? parseParty(i.billTo).company ?? "—"}</span>
                    <span className="text-xs text-ink/50">
                      {t("Vence", "Due")} {formatShortDate(i.dueAt, lang)}
                    </span>
                    <span className="w-24 text-right font-semibold tabular-nums text-ink">{formatCents(i.subtotal, i.currency, lang)}</span>
                    <span className={`rounded-full px-sp-2 py-0.5 font-mono text-[10px] uppercase ${meta.className}`}>{pickLabel(lang, meta)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Card>
        <p id="datos" className="mb-sp-1 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">
          {t("Tus datos para facturar", "Your billing details")}
        </p>
        <p className="mb-sp-4 text-sm text-ink/60">{t("Se usan en cada factura nueva.", "They're used on every new invoice.")}</p>
        <BillingProfileForm
          initial={{
            legalName: profile.legalName,
            location: profile.location,
            email: profile.email,
            payTo: profile.payTo,
            termsDays: profile.termsDays,
            depositPercent: profile.depositPercent,
            invoicePrefix: profile.invoicePrefix,
            defaultNotes: profile.defaultNotes,
          }}
        />
      </Card>
    </div>
  );
}
