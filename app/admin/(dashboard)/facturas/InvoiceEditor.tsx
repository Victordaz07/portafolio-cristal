"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { pickLabel } from "@/lib/admin-lang";
import { INVOICE_KINDS, formatCents, type InvoiceKind } from "@/lib/invoices";

export type EditorItem = { description: string; quantity: string; amount: string };
export type EditorValues = {
  brandId: string;
  kind: InvoiceKind;
  currency: string;
  language: "es" | "en";
  billName: string;
  billCompany: string;
  billEmail: string;
  issuedAt: string;
  dueAt: string;
  items: EditorItem[];
  notes: string;
  payTo: string;
};

const CURRENCIES = ["USD", "MXN", "EUR", "COP", "ARS", "CLP", "PEN", "DOP"];

/** "1,234.5" → 123450 centavos */
function toCents(value: string) {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

/** Crear una factura o editar un borrador. */
export default function InvoiceEditor({
  invoiceId,
  initial,
  brands,
}: {
  /** Si hay id, se edita ese borrador; si no, se crea una factura nueva. */
  invoiceId?: string;
  initial: EditorValues;
  brands: { id: string; name: string }[];
}) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof EditorValues>(key: K, value: EditorValues[K]) => setV((cur) => ({ ...cur, [key]: value }));
  const setItem = (i: number, change: Partial<EditorItem>) => set("items", v.items.map((item, j) => (j === i ? { ...item, ...change } : item)));

  const total = v.items.reduce((sum, item) => sum + Math.round((Number(item.quantity) || 0) * toCents(item.amount)), 0);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const body = {
      brandId: v.brandId || null,
      kind: v.kind,
      currency: v.currency,
      language: v.language,
      billTo: { name: v.billName, company: v.billCompany, email: v.billEmail },
      issuedAt: v.issuedAt,
      dueAt: v.dueAt,
      items: v.items
        .filter((item) => item.description.trim())
        .map((item) => ({ description: item.description.trim(), quantity: Number(item.quantity) || 1, unitAmount: toCents(item.amount) })),
      notes: v.notes,
      payTo: v.payTo,
    };
    const response = await fetch(invoiceId ? `/api/admin/invoices/${invoiceId}` : "/api/admin/invoices", {
      method: invoiceId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; id?: string };
    setSaving(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", t("Factura guardada", "Invoice saved"));
    if (!invoiceId && data.id) router.push(`/admin/facturas/${data.id}`);
    else router.refresh();
  }

  const label = "flex flex-col gap-sp-1 text-sm font-medium text-ink";
  const hint = "text-xs font-normal text-ink/50";

  return (
    <form onSubmit={save} className="flex flex-col gap-sp-5">
      <div className="grid gap-sp-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className={label}>
          {t("Trato", "Deal")}
          <select value={v.brandId} onChange={(e) => set("brandId", e.target.value)} className={inputClass}>
            <option value="">{t("Sin trato", "No deal")}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {t("Tipo", "Type")}
          <select value={v.kind} onChange={(e) => set("kind", e.target.value as InvoiceKind)} className={inputClass}>
            {INVOICE_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {pickLabel(lang, k)}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {t("Idioma de la factura", "Invoice language")}
          <select value={v.language} onChange={(e) => set("language", e.target.value as "es" | "en")} className={inputClass}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
          <span className={hint}>{t("La marca la ve y recibe los correos en este idioma.", "The brand sees it and gets emails in this language.")}</span>
        </label>
        <label className={label}>
          {t("Moneda", "Currency")}
          <select value={v.currency} onChange={(e) => set("currency", e.target.value)} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="grid gap-sp-4 rounded-[14px] border border-line bg-cream/60 p-sp-4 sm:grid-cols-3">
        <legend className="px-sp-1 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Para quién", "Bill to")}</legend>
        <label className={label}>
          {t("Empresa o marca", "Company or brand")}
          <input value={v.billCompany} onChange={(e) => set("billCompany", e.target.value)} className={inputClass} maxLength={200} />
        </label>
        <label className={label}>
          {t("Persona de contacto", "Contact person")}
          <input value={v.billName} onChange={(e) => set("billName", e.target.value)} className={inputClass} maxLength={200} />
        </label>
        <label className={label}>
          {t("Correo (para enviarla)", "Email (to send it)")}
          <input type="email" value={v.billEmail} onChange={(e) => set("billEmail", e.target.value)} className={inputClass} placeholder="pagos@marca.com" />
        </label>
      </fieldset>

      <div className="grid gap-sp-4 sm:grid-cols-2">
        <label className={label}>
          {t("Fecha de la factura", "Invoice date")}
          <input type="date" required value={v.issuedAt} onChange={(e) => set("issuedAt", e.target.value)} className={inputClass} />
        </label>
        <label className={label}>
          {t("Vence el", "Due on")}
          <input type="date" required value={v.dueAt} onChange={(e) => set("dueAt", e.target.value)} className={inputClass} />
        </label>
      </div>

      <div>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Qué cobras", "What you're charging")}</p>
        <div className="flex flex-col gap-sp-2">
          {v.items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-sp-2 rounded-[12px] border border-line bg-white p-sp-2 sm:grid-cols-[1fr_80px_130px_auto] sm:border-0 sm:p-0">
              <input
                value={item.description}
                onChange={(e) => setItem(i, { description: e.target.value })}
                placeholder={t("Ej.: 2 reels de Instagram", "E.g.: 2 Instagram reels")}
                aria-label={t("Descripción", "Description")}
                maxLength={300}
                className={`${inputClass} col-span-2 sm:col-span-1`}
              />
              <input
                type="number"
                min={0.01}
                step="any"
                value={item.quantity}
                onChange={(e) => setItem(i, { quantity: e.target.value })}
                aria-label={t("Cantidad", "Quantity")}
                className={inputClass}
              />
              <input
                inputMode="decimal"
                value={item.amount}
                onChange={(e) => setItem(i, { amount: e.target.value })}
                placeholder="0.00"
                aria-label={t("Precio por unidad", "Unit price")}
                className={inputClass}
              />
              <button
                type="button"
                disabled={v.items.length === 1}
                onClick={() => set("items", v.items.filter((_, j) => j !== i))}
                aria-label={t("Quitar línea", "Remove line")}
                className="px-sp-2 text-ink/40 hover:text-red-600 disabled:opacity-20"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="mt-sp-2 flex flex-wrap items-center justify-between gap-sp-2">
          <button type="button" onClick={() => set("items", [...v.items, { description: "", quantity: "1", amount: "" }])} className="text-sm font-semibold text-coral hover:underline">
            {t("+ Agregar línea", "+ Add line")}
          </button>
          <p className="text-sm">
            {t("Total", "Total")}: <strong className="font-fraunces text-2xl">{formatCents(total, v.currency, lang)}</strong>
          </p>
        </div>
      </div>

      <div className="grid gap-sp-4 sm:grid-cols-2">
        <label className={label}>
          {t("Cómo pagar", "How to pay")}
          <textarea rows={3} value={v.payTo} onChange={(e) => set("payTo", e.target.value)} className={inputClass} maxLength={1000} placeholder={t("PayPal: tu@correo.com · Zelle: …", "PayPal: you@email.com · Zelle: …")} />
          <span className={hint}>{t("Solo lo que quieras que vea la marca. Nunca pongas tu número de seguro social.", "Only what you want the brand to see. Never include your social security number.")}</span>
        </label>
        <label className={label}>
          {t("Notas", "Notes")}
          <textarea rows={3} value={v.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} maxLength={2000} placeholder={t("¡Gracias por trabajar conmigo!", "Thanks for working with me!")} />
        </label>
      </div>

      <div className="flex flex-wrap gap-sp-3">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? t("Guardando…", "Saving…") : invoiceId ? t("Guardar cambios", "Save changes") : t("Crear borrador", "Create draft")}
        </button>
        <button type="button" onClick={() => router.push("/admin/facturas")} className={secondaryButtonClass}>
          {t("Cancelar", "Cancel")}
        </button>
      </div>
    </form>
  );
}
