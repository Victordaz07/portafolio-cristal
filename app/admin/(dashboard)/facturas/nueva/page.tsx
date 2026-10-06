import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { dateToInput } from "@/lib/crm";
import { depositSplit, type InvoiceKind } from "@/lib/invoices";
import { getBillingProfile } from "@/lib/invoices-server";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import InvoiceEditor, { type EditorValues } from "../InvoiceEditor";

export const dynamic = "force-dynamic";

const dollars = (cents: number) => (cents / 100).toFixed(cents % 100 ? 2 : 0);

/** Nueva factura. Con ?marca=<id>&tipo=full|deposit|balance se llena con los datos del trato. */
export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ marca?: string; tipo?: string }> }) {
  const { t, lang } = await getT();
  const sp = await searchParams;
  const kind: InvoiceKind = sp.tipo === "deposit" || sp.tipo === "balance" ? sp.tipo : "full";
  const [profile, brands, brand] = await Promise.all([
    getBillingProfile(),
    prisma.brand.findMany({ where: { dealStatus: { not: null } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    sp.marca
      ? prisma.brand.findUnique({
          where: { id: sp.marca },
          select: { id: true, name: true, contactName: true, contactEmail: true, dealValue: true, packageDetail: true, deliverables: { orderBy: { order: "asc" }, select: { title: true } } },
        })
      : null,
  ]);

  const today = new Date();
  const due = new Date(today.getTime() + profile.termsDays * 86_400_000);
  const what =
    brand?.packageDetail?.trim() ||
    (brand?.deliverables.length ? brand.deliverables.map((d) => d.title).join(" · ") : "") ||
    (brand ? t(`Colaboración de contenido con ${brand.name}`, `Content collaboration with ${brand.name}`) : "");
  const total = (brand?.dealValue ?? 0) * 100;
  const { deposit, balance } = depositSplit(total, profile.depositPercent);
  const amount = kind === "deposit" ? deposit : kind === "balance" ? balance : total;
  const description =
    kind === "deposit"
      ? t(`Anticipo (${profile.depositPercent}%) — ${what}`, `Deposit (${profile.depositPercent}%) — ${what}`)
      : kind === "balance"
        ? t(`Saldo (${100 - profile.depositPercent}%) — ${what}`, `Balance (${100 - profile.depositPercent}%) — ${what}`)
        : what;

  const initial: EditorValues = {
    brandId: brand?.id ?? "",
    kind,
    currency: "USD",
    language: lang,
    billName: brand?.contactName ?? "",
    billCompany: brand?.name ?? "",
    billEmail: brand?.contactEmail ?? "",
    issuedAt: dateToInput(today),
    dueAt: dateToInput(due),
    items: [{ description, quantity: "1", amount: amount ? dollars(amount) : "" }],
    notes: profile.defaultNotes,
    payTo: profile.payTo,
  };
  const missingProfile = !profile.legalName || !profile.payTo;

  return (
    <div className="flex flex-col gap-sp-5">
      <Link href="/admin/facturas" className="text-sm font-medium text-coral hover:underline">
        {t("← Facturas", "← Invoices")}
      </Link>
      <PageHeader
        eyebrow={t("Facturas", "Invoices")}
        title={t("Nueva factura", "New invoice")}
        description={t("Se guarda como borrador. Cuando esté lista, la envías a la marca con un enlace.", "It's saved as a draft. When it's ready, you send it to the brand with a link.")}
      />
      {missingProfile && (
        <p className="rounded-[14px] bg-coral/10 px-sp-4 py-sp-3 text-sm text-ink">
          {t("Antes de enviarla, completa tus ", "Before sending it, complete your ")}
          <Link href="/admin/facturas#datos" className="font-semibold text-coral hover:underline">
            {t("datos para facturar", "billing details")}
          </Link>
          {t(" (tu nombre y cómo te pagan).", " (your name and how to pay you).")}
        </p>
      )}
      <Card>
        <InvoiceEditor initial={initial} brands={brands} />
      </Card>
    </div>
  );
}
