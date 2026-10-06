"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { decidePayment } from "../PendingPayments";
import { dateLocale, type AdminLang } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

interface PaymentRow {
  id: string;
  date: string;
  plan: string;
  months: number;
  amount: string;
  method: string;
  reference: string | null;
  status: string;
  periodEnd: string | null;
}

const STATUS: Record<string, string> = { reported: "Por confirmar", confirmed: "Confirmado", rejected: "No encontrado" };
const STATUS_EN: Record<string, string> = { reported: "To confirm", confirmed: "Confirmed", rejected: "Not found" };
const dayIn = (lang: AdminLang) => (iso: string) =>
  new Date(iso).toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function BillingCard({
  creatorId,
  plan,
  comp,
  ambassador,
  referralLink,
  stateLabel,
  until,
  plans,
  payments,
}: {
  creatorId: string;
  plan: string;
  comp: boolean;
  ambassador: boolean;
  referralLink: string | null;
  stateLabel: string;
  until: string | null;
  plans: { id: string; name: string; price: number }[];
  payments: PaymentRow[];
}) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const day = dayIn(lang);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ plan, months: 1, amount: "", method: "paypal", reference: "" });

  async function patch(data: object, ok: string) {
    setBusy(true);
    const response = await fetch(`/api/admin/platform/creators/${creatorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!response.ok) return showToast("error", t("No se pudo actualizar", "Couldn't update"));
    showToast("success", ok);
    router.refresh();
  }

  async function register(event: React.FormEvent) {
    event.preventDefault();
    const listPrice = (plans.find((p) => p.id === form.plan)?.price ?? 0) * form.months;
    const amount = form.amount ? Number(form.amount) : listPrice;
    if (!window.confirm(
        t(
          `¿Registrar un pago de US$${amount} por ${form.months} mes(es)? Se activa el plan y le llega un correo.`,
          `Record a US$${amount} payment for ${form.months} month(s)? The plan activates and they get an email.`
        )
      )) return;
    setBusy(true);
    const response = await fetch(`/api/admin/platform/creators/${creatorId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: form.plan,
        months: form.months,
        method: form.method,
        reference: form.reference,
        ...(form.amount ? { amount: Number(form.amount) } : {}),
      }),
    });
    setBusy(false);
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) return showToast("error", body.error ?? t("No se pudo registrar", "Couldn't record it"));
    showToast("success", t("Pago registrado", "Payment recorded"));
    setForm((f) => ({ ...f, amount: "", reference: "" }));
    router.refresh();
  }

  async function decide(id: string, action: "confirm" | "reject") {
    setBusy(true);
    const error = await decidePayment(id, action);
    setBusy(false);
    if (error) return showToast("error", error);
    showToast("success", action === "confirm" ? t("Pago confirmado", "Payment confirmed") : t("Pago marcado como no encontrado", "Payment marked as not found"));
    router.refresh();
  }

  return (
    <Card>
      <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Plan y pagos", "Plan & payments")}</p>
      <p className="text-sm text-ink">
        <strong>{comp ? t("Cortesía", "Complimentary") : plans.find((p) => p.id === plan)?.name ?? plan}</strong> · {stateLabel}
        {until ? ` · ${t("hasta", "until")} ${day(until)}` : ""}
      </p>
      <div className="mt-sp-3 flex flex-wrap gap-sp-2">
        <button type="button" disabled={busy} onClick={() => patch({ comp: !comp }, comp ? t("Ya no es de cortesía", "No longer complimentary") : t("Cuenta de cortesía", "Complimentary account"))} className={secondaryButtonClass}>
          {comp ? t("Quitar cortesía", "Remove complimentary") : t("Hacer cortesía (no paga)", "Make complimentary (no charge)")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!ambassador && !window.confirm(t("¿Dar el nivel Embajadora? Tendrá Folio Pro sin pagar y se le crea su enlace de referidos. Lo puedes quitar cuando quieras.", "Give the Ambassador tier? They get Folio Pro with nothing to pay and a referral link is created. You can remove it any time."))) return;
            void patch({ ambassador: !ambassador }, ambassador ? t("Ya no es embajadora", "No longer an ambassador") : t("Ahora es embajadora", "Now an ambassador"));
          }}
          className={secondaryButtonClass}
        >
          {ambassador ? t("Quitar nivel Embajadora", "Remove Ambassador tier") : t("Hacer embajadora 💜", "Make ambassador 💜")}
        </button>
        {!comp && !ambassador && (
          <button type="button" disabled={busy} onClick={() => patch({ extendTrialDays: 7 }, t("Prueba extendida 7 días", "Trial extended 7 days"))} className={secondaryButtonClass}>
            {t("+7 días de prueba", "+7 trial days")}
          </button>
        )}
      </div>

      {ambassador && referralLink && (
        <p className="mt-sp-3 break-all rounded-[12px] bg-cream p-sp-3 text-xs text-ink/70">
          {t("Enlace de referidos", "Referral link")}: <strong className="select-all text-ink">{referralLink}</strong>
        </p>
      )}

      {!comp && (
        <form onSubmit={register} className="mt-sp-4 grid gap-sp-3 rounded-[12px] bg-cream p-sp-3 sm:grid-cols-2">
          <p className="text-sm font-semibold text-ink sm:col-span-2">{t("Registrar un pago que ya recibiste", "Record a payment you already received")}</p>
          <label className={labelClass}>
            <span className="text-xs font-medium text-ink">Plan</span>
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className={inputClass}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (US${p.price}/{t("mes", "mo")})
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className="text-xs font-medium text-ink">{t("Meses", "Months")}</span>
            <input type="number" min={1} max={36} value={form.months} onChange={(e) => setForm({ ...form, months: Number(e.target.value) || 1 })} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className="text-xs font-medium text-ink">{t("Monto recibido (US$, vacío = precio de lista)", "Amount received (US$, empty = list price)")}</span>
            <input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className="text-xs font-medium text-ink">{t("Método", "Method")}</span>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inputClass}>
              <option value="paypal">PayPal</option>
              <option value="transfer">{t("Transferencia bancaria", "Bank transfer")}</option>
              <option value="other">{t("Otro", "Other")}</option>
            </select>
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            <span className="text-xs font-medium text-ink">{t("Referencia (opcional)", "Reference (optional)")}</span>
            <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} maxLength={120} className={inputClass} />
          </label>
          <button type="submit" disabled={busy} className={`${primaryButtonClass} w-fit`}>
            {t("Registrar pago", "Record payment")}
          </button>
        </form>
      )}

      {payments.length > 0 && (
        <table className="mt-sp-4 w-full text-sm">
          <thead className="font-mono text-[10px] uppercase text-ink/50">
            <tr>
              <th className="py-1 text-left">{t("Fecha", "Date")}</th>
              <th className="py-1 text-left">{t("Pago", "Payment")}</th>
              <th className="py-1 text-left">{t("Estado", "Status")}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-line align-top">
                <td className="py-1.5">{day(p.date)}</td>
                <td className="py-1.5">
                  <strong>{p.amount}</strong> · {p.plan} · {p.months}m · {p.method}
                  {p.reference && <span className="block text-xs text-ink/50">Ref.: {p.reference}</span>}
                </td>
                <td className="py-1.5">
                  {(lang === "en" ? STATUS_EN : STATUS)[p.status] ?? p.status}
                  {p.periodEnd && <span className="block text-xs text-ink/50">
                      {t("hasta", "until")} {day(p.periodEnd)}
                    </span>}
                  {p.status === "reported" && (
                    <span className="mt-1 flex gap-sp-2 text-xs font-semibold">
                      <button type="button" disabled={busy} onClick={() => decide(p.id, "confirm")} className="text-coral hover:underline">
                        {t("Confirmar", "Confirm")}
                      </button>
                      <button type="button" disabled={busy} onClick={() => decide(p.id, "reject")} className="text-ink/60 hover:underline">
                        {t("No lo encuentro", "Can't find it")}
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
