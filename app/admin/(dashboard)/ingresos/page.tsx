import { getT } from "@/lib/admin-lang-server";
import { formatCents } from "@/lib/invoices";
import { EXPENSE_CATEGORIES, INCOME_SOURCES, nextQuarterlyDate, summarizeYear, taxReserve } from "@/lib/income";
import { loadYear } from "@/lib/income-server";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import IncomeManager from "./IncomeManager";

export const dynamic = "force-dynamic";

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function IncomePage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { t, lang } = await getT();
  const { year: rawYear } = await searchParams;
  const now = new Date();
  const thisYear = now.getUTCFullYear();
  const parsed = Number(rawYear);
  const year = Number.isInteger(parsed) && parsed >= 2000 && parsed <= thisYear + 1 ? parsed : thisYear;
  const data = await loadYear(year);
  const summary = summarizeYear(data.income, data.expenses, year);
  const reserve = taxReserve(summary.net, data.taxPercent);
  const next = nextQuarterlyDate(now);
  const money = (cents: number) => formatCents(cents, "USD", lang);
  const months = lang === "en" ? MONTHS_EN : MONTHS_ES;
  const maxMonth = Math.max(1, ...summary.months.map((m) => Math.max(m.income, m.expenses)));

  const kpis = [
    { label: t("Ingresos", "Income"), value: money(summary.income) },
    { label: t("Gastos", "Expenses"), value: money(summary.expenses) },
    { label: t("Ganancia", "Profit"), value: money(summary.net) },
    { label: t(`Apartar para impuestos (${data.taxPercent}%)`, `Set aside for taxes (${data.taxPercent}%)`), value: money(reserve), accent: true },
  ];

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Negocio", "Business")}
        title={t("Mis ingresos", "My income")}
        description={t(
          "Todo lo que ganaste y gastaste en el año, y cuánto conviene apartar para impuestos. Las facturas pagadas cuentan solas.",
          "Everything you earned and spent this year, and how much to set aside for taxes. Paid invoices count automatically."
        )}
      />
      <p role="note" className="rounded-[14px] border border-line bg-cream px-sp-4 py-sp-3 text-xs text-ink/70">
        {t(
          "No es asesoría fiscal. Son números de referencia para que llegues ordenada con tu contador; las reglas dependen de tu situación y de tu estado.",
          "This is not tax advice. These are reference numbers to help you show up organized to your accountant; the rules depend on your situation and state."
        )}
      </p>

      <div className="flex flex-wrap items-center gap-sp-2 text-sm">
        {[thisYear, thisYear - 1, thisYear - 2].map((y) => (
          <a key={y} href={`/admin/ingresos?year=${y}`} className={`rounded-full border px-sp-4 py-1.5 font-medium ${y === year ? "border-ink bg-ink text-cream" : "border-line text-ink hover:border-coral"}`}>
            {y}
          </a>
        ))}
        <a href={`/api/admin/income/export?year=${year}`} className="ml-auto rounded-full border border-line px-sp-4 py-1.5 font-medium text-ink hover:border-coral hover:text-coral">
          {t("⬇ Descargar CSV para el contador", "⬇ Download CSV for your accountant")}
        </a>
      </div>

      <div className="grid grid-cols-2 gap-sp-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <p className="text-xs text-ink/60">{k.label}</p>
            <p className={`mt-1 font-fraunces text-2xl font-semibold ${k.accent ? "text-coral" : "text-ink"}`}>{k.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Mes a mes", "Month by month")}</p>
        <ul className="flex flex-col gap-sp-2">
          {summary.months.map((m, i) => (
            <li key={m.month} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-sp-3 text-xs">
              <span className="text-ink/60">{months[i]}</span>
              <span className="flex flex-col gap-0.5">
                <span className="h-2 rounded-full bg-lime" style={{ width: `${(m.income / maxMonth) * 100}%` }} />
                <span className="h-2 rounded-full bg-coral/60" style={{ width: `${(m.expenses / maxMonth) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums text-ink">
                {money(m.income)} <span className="text-ink/40">/ {money(m.expenses)}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-sp-3 text-[11px] text-ink/50">{t("Verde: ingresos · Rosa: gastos", "Green: income · Pink: expenses")}</p>
      </Card>

      <div className="grid gap-sp-3 sm:grid-cols-2">
        <Card>
          <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Por fuente", "By source")}</p>
          <ul className="flex flex-col gap-1 text-sm">
            {INCOME_SOURCES.map((s) => (
              <li key={s.id} className="flex justify-between"><span className="text-ink/70">{lang === "en" ? s.labelEn : s.label}</span><span className="tabular-nums">{money(summary.bySource[s.id])}</span></li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Gastos por tipo", "Expenses by type")}</p>
          <ul className="flex flex-col gap-1 text-sm">
            {EXPENSE_CATEGORIES.map((c) => (
              <li key={c.id} className="flex justify-between"><span className="text-ink/70">{lang === "en" ? c.labelEn : c.label}</span><span className="tabular-nums">{money(summary.byCategory[c.id])}</span></li>
            ))}
          </ul>
        </Card>
      </div>

      <IncomeManager
        year={year}
        taxPercent={data.taxPercent}
        nextDue={{ date: next.date.toISOString().slice(0, 10), days: next.days, label: lang === "en" ? next.labelEn : next.label }}
        skippedInvoices={data.skippedInvoices}
        income={data.income}
        expenses={data.expenses}
      />
    </div>
  );
}
