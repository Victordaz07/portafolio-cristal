"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { EXPENSE_CATEGORIES, INCOME_SOURCES, MAX_TAX_PERCENT, parseAmount } from "@/lib/income";
import { formatCents } from "@/lib/invoices";
import type { ExpenseRow, IncomeRow } from "@/lib/income-server";

const today = () => new Date().toISOString().slice(0, 10);

/** Registro de ingresos y gastos, % de impuestos y recordatorio de pagos trimestrales. */
export default function IncomeManager({
  year,
  taxPercent,
  nextDue,
  skippedInvoices,
  income,
  expenses,
}: {
  year: number;
  taxPercent: number;
  nextDue: { date: string; days: number; label: string };
  skippedInvoices: number;
  income: IncomeRow[];
  expenses: ExpenseRow[];
}) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(String(taxPercent));
  const [inc, setInc] = useState({ date: today(), amount: "", source: "affiliate", description: "" });
  const [exp, setExp] = useState({ date: today(), amount: "", category: "equipment", description: "", receiptUrl: "" });
  const money = (cents: number) => formatCents(cents, "USD", lang);

  async function send(url: string, method: string, body?: object, ok?: string) {
    setBusy(true);
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
      return false;
    }
    if (ok) showToast("success", ok);
    router.refresh();
    return true;
  }

  async function addIncome(event: React.FormEvent) {
    event.preventDefault();
    const cents = parseAmount(inc.amount);
    if (!cents) return showToast("error", t("Escribe un monto válido", "Enter a valid amount"));
    if (await send("/api/admin/income", "POST", { date: inc.date, amountCents: cents, source: inc.source, description: inc.description }, t("Ingreso anotado", "Income recorded"))) {
      setInc({ ...inc, amount: "", description: "" });
    }
  }

  async function addExpense(event: React.FormEvent) {
    event.preventDefault();
    const cents = parseAmount(exp.amount);
    if (!cents) return showToast("error", t("Escribe un monto válido", "Enter a valid amount"));
    if (await send("/api/admin/expenses", "POST", { date: exp.date, amountCents: cents, category: exp.category, description: exp.description, receiptUrl: exp.receiptUrl }, t("Gasto anotado", "Expense recorded"))) {
      setExp({ ...exp, amount: "", description: "", receiptUrl: "" });
    }
  }

  async function savePercent() {
    const n = Number(percent);
    if (!Number.isInteger(n) || n < 0 || n > MAX_TAX_PERCENT) return showToast("error", t(`Elige un número entre 0 y ${MAX_TAX_PERCENT}`, `Choose a number between 0 and ${MAX_TAX_PERCENT}`));
    await send("/api/admin/income/settings", "PATCH", { taxPercent: n }, t("Porcentaje guardado", "Percentage saved"));
  }

  const remove = async (url: string) => {
    if (window.confirm(t("¿Borrar este renglón?", "Delete this entry?"))) await send(url, "DELETE");
  };
  const sourceLabel = (id: string) => INCOME_SOURCES.find((s) => s.id === id)?.[lang === "en" ? "labelEn" : "label"] ?? id;
  const categoryLabel = (id: string) => EXPENSE_CATEGORIES.find((c) => c.id === id)?.[lang === "en" ? "labelEn" : "label"] ?? id;
  const label = "flex flex-col gap-sp-1 text-xs font-medium text-ink";

  return (
    <>
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Impuestos", "Taxes")}</p>
        <div className="flex flex-wrap items-end gap-sp-4">
          <label className={label}>
            {t("% que apartas de tu ganancia", "% of your profit to set aside")}
            <span className="flex items-center gap-sp-2">
              <input type="number" min={0} max={MAX_TAX_PERCENT} value={percent} onChange={(e) => setPercent(e.target.value)} className={`${inputClass} w-24`} />
              <button type="button" onClick={savePercent} disabled={busy} className={secondaryButtonClass}>{t("Guardar", "Save")}</button>
            </span>
          </label>
          <p className="max-w-md text-sm text-ink/70">
            {t(
              `Próximo pago trimestral de impuestos estimados en EE. UU.: ${nextDue.date} (${nextDue.label}) — ${nextDue.days === 0 ? "es hoy" : `en ${nextDue.days} días`}. Si vives fuera de EE. UU., ignora esta fecha.`,
              `Next US quarterly estimated tax payment: ${nextDue.date} (${nextDue.label}) — ${nextDue.days === 0 ? "it's today" : `in ${nextDue.days} days`}. If you live outside the US, ignore this date.`
            )}
          </p>
        </div>
        {skippedInvoices > 0 && (
          <p className="mt-sp-3 text-xs text-ink/60">
            {t(`${skippedInvoices} factura(s) pagadas en otra moneda no se suman aquí. Anótalas a mano en dólares si quieres incluirlas.`, `${skippedInvoices} paid invoice(s) in another currency aren't added here. Record them by hand in dollars if you want them included.`)}
          </p>
        )}
      </Card>

      <div className="grid gap-sp-3 lg:grid-cols-2">
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Anotar un ingreso", "Record income")}</p>
          <form onSubmit={addIncome} className="grid gap-sp-3 sm:grid-cols-2">
            <label className={label}>{t("Fecha", "Date")}<input type="date" required value={inc.date} onChange={(e) => setInc({ ...inc, date: e.target.value })} className={inputClass} /></label>
            <label className={label}>{t("Monto (USD)", "Amount (USD)")}<input inputMode="decimal" required value={inc.amount} onChange={(e) => setInc({ ...inc, amount: e.target.value })} placeholder="250.00" className={inputClass} /></label>
            <label className={label}>{t("Fuente", "Source")}
              <select value={inc.source} onChange={(e) => setInc({ ...inc, source: e.target.value })} className={inputClass}>
                {INCOME_SOURCES.map((s) => <option key={s.id} value={s.id}>{lang === "en" ? s.labelEn : s.label}</option>)}
              </select>
            </label>
            <label className={label}>{t("Nota (opcional)", "Note (optional)")}<input maxLength={200} value={inc.description} onChange={(e) => setInc({ ...inc, description: e.target.value })} className={inputClass} /></label>
            <button type="submit" disabled={busy} className={`${primaryButtonClass} sm:col-span-2`}>{t("Anotar ingreso", "Record income")}</button>
          </form>
        </Card>
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Anotar un gasto", "Record an expense")}</p>
          <form onSubmit={addExpense} className="grid gap-sp-3 sm:grid-cols-2">
            <label className={label}>{t("Fecha", "Date")}<input type="date" required value={exp.date} onChange={(e) => setExp({ ...exp, date: e.target.value })} className={inputClass} /></label>
            <label className={label}>{t("Monto (USD)", "Amount (USD)")}<input inputMode="decimal" required value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} placeholder="39.99" className={inputClass} /></label>
            <label className={label}>{t("Tipo", "Type")}
              <select value={exp.category} onChange={(e) => setExp({ ...exp, category: e.target.value })} className={inputClass}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{lang === "en" ? c.labelEn : c.label}</option>)}
              </select>
            </label>
            <label className={label}>{t("Nota (opcional)", "Note (optional)")}<input maxLength={200} value={exp.description} onChange={(e) => setExp({ ...exp, description: e.target.value })} className={inputClass} /></label>
            <div className="sm:col-span-2">
              <ImageUploadField label={t("Foto del recibo (opcional)", "Receipt photo (optional)")} value={exp.receiptUrl} onChange={(url) => setExp({ ...exp, receiptUrl: url })} />
              <p className="mt-1 text-[11px] text-ink/50">{t("El enlace de la foto no es público en tu sitio, pero no subas recibos con datos bancarios ni números de identificación.", "The photo link isn't shown on your site, but don't upload receipts with bank details or ID numbers.")}</p>
            </div>
            <button type="submit" disabled={busy} className={`${primaryButtonClass} sm:col-span-2`}>{t("Anotar gasto", "Record expense")}</button>
          </form>
        </Card>
      </div>

      <div className="grid gap-sp-3 lg:grid-cols-2">
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t(`Ingresos ${year}`, `Income ${year}`)}</p>
          {income.length === 0 ? (
            <p className="text-sm text-ink/60">{t("Todavía no hay ingresos este año. Las facturas pagadas aparecen aquí solas.", "No income yet this year. Paid invoices show up here automatically.")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line text-sm">
              {income.map((i) => (
                <li key={`${i.origin}-${i.id}`} className="flex items-center justify-between gap-sp-3 py-sp-2">
                  <span className="min-w-0">
                    <span className="block truncate text-ink">{i.description || sourceLabel(i.source)}</span>
                    <span className="text-xs text-ink/50">{i.date} · {sourceLabel(i.source)}{i.origin === "invoice" ? ` · ${t("factura", "invoice")}` : ""}</span>
                  </span>
                  <span className="flex items-center gap-sp-3">
                    <span className="tabular-nums text-ink">{money(i.cents)}</span>
                    {i.origin === "manual" && <button type="button" onClick={() => remove(`/api/admin/income/${i.id}`)} aria-label={t("Borrar", "Delete")} className="text-xs text-red-600/70 hover:text-red-600">✕</button>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t(`Gastos ${year}`, `Expenses ${year}`)}</p>
          {expenses.length === 0 ? (
            <p className="text-sm text-ink/60">{t("Todavía no hay gastos anotados este año.", "No expenses recorded yet this year.")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line text-sm">
              {expenses.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-sp-3 py-sp-2">
                  <span className="min-w-0">
                    <span className="block truncate text-ink">{e.description || categoryLabel(e.category)}</span>
                    <span className="text-xs text-ink/50">
                      {e.date} · {categoryLabel(e.category)}
                      {e.receiptUrl && <> · <a href={e.receiptUrl} target="_blank" rel="noreferrer noopener" className="text-coral hover:underline">{t("recibo", "receipt")}</a></>}
                    </span>
                  </span>
                  <span className="flex items-center gap-sp-3">
                    <span className="tabular-nums text-ink">{money(e.cents)}</span>
                    <button type="button" onClick={() => remove(`/api/admin/expenses/${e.id}`)} aria-label={t("Borrar", "Delete")} className="text-xs text-red-600/70 hover:text-red-600">✕</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
