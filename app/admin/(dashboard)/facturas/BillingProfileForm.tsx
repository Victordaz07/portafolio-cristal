"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";

export type BillingProfileValues = {
  legalName: string;
  location: string;
  email: string;
  payTo: string;
  termsDays: number;
  depositPercent: number;
  invoicePrefix: string;
  defaultNotes: string;
};

/** Datos con los que facturas: van en cada factura nueva. */
export default function BillingProfileForm({ initial }: { initial: BillingProfileValues }) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof BillingProfileValues>(key: K, value: BillingProfileValues[K]) => setV((cur) => ({ ...cur, [key]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/billing-profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", t("Datos para facturar guardados", "Billing details saved"));
    router.refresh();
  }

  const label = "flex flex-col gap-sp-1 text-sm font-medium text-ink";
  const hint = "text-xs font-normal text-ink/50";
  return (
    <form onSubmit={save} className="grid gap-sp-4 sm:grid-cols-2">
      <label className={label}>
        {t("Nombre en la factura", "Name on the invoice")}
        <input value={v.legalName} onChange={(e) => set("legalName", e.target.value)} className={inputClass} maxLength={200} />
        <span className={hint}>{t("Tu nombre legal o artístico, o el de tu negocio.", "Your legal or stage name, or your business name.")}</span>
      </label>
      <label className={label}>
        {t("Ciudad y país", "City and country")}
        <input value={v.location} onChange={(e) => set("location", e.target.value)} className={inputClass} maxLength={200} placeholder="Miami, FL, EE. UU." />
      </label>
      <label className={label}>
        {t("Correo que verá la marca", "Email the brand will see")}
        <input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
      </label>
      <label className={label}>
        {t("Prefijo del número", "Number prefix")}
        <input value={v.invoicePrefix} onChange={(e) => set("invoicePrefix", e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 6))} className={inputClass} />
        <span className={hint}>{t(`Tus facturas se numeran ${v.invoicePrefix || "FC"}-2026-0001, 0002…`, `Your invoices are numbered ${v.invoicePrefix || "FC"}-2026-0001, 0002…`)}</span>
      </label>
      <label className={`${label} sm:col-span-2`}>
        {t("Cómo te pagan", "How you get paid")}
        <textarea rows={3} value={v.payTo} onChange={(e) => set("payTo", e.target.value)} className={inputClass} maxLength={1000} placeholder={t("PayPal: tu@correo.com · Zelle: 305… · Transferencia: pide los datos por correo", "PayPal: you@email.com · Zelle: 305… · Bank transfer: ask for details by email")} />
        <span className={hint}>
          {t(
            "Solo lo que quieras que vea la marca. Nunca pongas tu número de seguro social (SSN/ITIN) ni números de cuenta completos.",
            "Only what you want the brand to see. Never include your social security number (SSN/ITIN) or full account numbers."
          )}
        </span>
      </label>
      <label className={label}>
        {t("Plazo para pagar (días)", "Payment terms (days)")}
        <input type="number" min={0} max={180} value={v.termsDays} onChange={(e) => set("termsDays", Number(e.target.value) || 0)} className={inputClass} />
        <span className={hint}>{t("Lo común es 15 o 30 días.", "15 or 30 days is common.")}</span>
      </label>
      <label className={label}>
        {t("Anticipo (%)", "Deposit (%)")}
        <input type="number" min={0} max={100} value={v.depositPercent} onChange={(e) => set("depositPercent", Number(e.target.value) || 0)} className={inputClass} />
        <span className={hint}>{t("Para las facturas de anticipo y saldo. Muchos creadores piden 50%.", "For deposit and balance invoices. Many creators ask for 50%.")}</span>
      </label>
      <label className={`${label} sm:col-span-2`}>
        {t("Nota al pie (por defecto)", "Footer note (default)")}
        <textarea rows={2} value={v.defaultNotes} onChange={(e) => set("defaultNotes", e.target.value)} className={inputClass} maxLength={2000} placeholder={t("¡Gracias por trabajar conmigo!", "Thanks for working with me!")} />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? t("Guardando…", "Saving…") : t("Guardar datos", "Save details")}
        </button>
      </div>
    </form>
  );
}
