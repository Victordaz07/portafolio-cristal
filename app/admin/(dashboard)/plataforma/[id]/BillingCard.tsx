"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { decidePayment } from "../PendingPayments";

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
const day = (iso: string) => new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function BillingCard({
  creatorId,
  plan,
  comp,
  stateLabel,
  until,
  plans,
  payments,
}: {
  creatorId: string;
  plan: string;
  comp: boolean;
  stateLabel: string;
  until: string | null;
  plans: { id: string; name: string; price: number }[];
  payments: PaymentRow[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
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
    if (!response.ok) return showToast("error", "No se pudo actualizar");
    showToast("success", ok);
    router.refresh();
  }

  async function register(event: React.FormEvent) {
    event.preventDefault();
    const listPrice = (plans.find((p) => p.id === form.plan)?.price ?? 0) * form.months;
    const amount = form.amount ? Number(form.amount) : listPrice;
    if (!window.confirm(`¿Registrar un pago de US$${amount} por ${form.months} mes(es)? Se activa el plan y le llega un correo.`)) return;
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
    if (!response.ok) return showToast("error", body.error ?? "No se pudo registrar");
    showToast("success", "Pago registrado");
    setForm((f) => ({ ...f, amount: "", reference: "" }));
    router.refresh();
  }

  async function decide(id: string, action: "confirm" | "reject") {
    setBusy(true);
    const error = await decidePayment(id, action);
    setBusy(false);
    if (error) return showToast("error", error);
    showToast("success", action === "confirm" ? "Pago confirmado" : "Pago marcado como no encontrado");
    router.refresh();
  }

  return (
    <Card>
      <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Plan y pagos</p>
      <p className="text-sm text-ink">
        <strong>{comp ? "Cortesía" : plans.find((p) => p.id === plan)?.name ?? plan}</strong> · {stateLabel}
        {until ? ` · hasta ${day(until)}` : ""}
      </p>
      <div className="mt-sp-3 flex flex-wrap gap-sp-2">
        <button type="button" disabled={busy} onClick={() => patch({ comp: !comp }, comp ? "Ya no es de cortesía" : "Cuenta de cortesía")} className={secondaryButtonClass}>
          {comp ? "Quitar cortesía" : "Hacer cortesía (no paga)"}
        </button>
        {!comp && (
          <button type="button" disabled={busy} onClick={() => patch({ extendTrialDays: 7 }, "Prueba extendida 7 días")} className={secondaryButtonClass}>
            +7 días de prueba
          </button>
        )}
      </div>

      {!comp && (
        <form onSubmit={register} className="mt-sp-4 grid gap-sp-3 rounded-[12px] bg-cream p-sp-3 sm:grid-cols-2">
          <p className="text-sm font-semibold text-ink sm:col-span-2">Registrar un pago que ya recibiste</p>
          <label className={labelClass}>
            <span className="text-xs font-medium text-ink">Plan</span>
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className={inputClass}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (US${p.price}/mes)
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className="text-xs font-medium text-ink">Meses</span>
            <input type="number" min={1} max={36} value={form.months} onChange={(e) => setForm({ ...form, months: Number(e.target.value) || 1 })} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className="text-xs font-medium text-ink">Monto recibido (US$, vacío = precio de lista)</span>
            <input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className="text-xs font-medium text-ink">Método</span>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inputClass}>
              <option value="paypal">PayPal</option>
              <option value="transfer">Transferencia bancaria</option>
              <option value="other">Otro</option>
            </select>
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            <span className="text-xs font-medium text-ink">Referencia (opcional)</span>
            <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} maxLength={120} className={inputClass} />
          </label>
          <button type="submit" disabled={busy} className={`${primaryButtonClass} w-fit`}>
            Registrar pago
          </button>
        </form>
      )}

      {payments.length > 0 && (
        <table className="mt-sp-4 w-full text-sm">
          <thead className="font-mono text-[10px] uppercase text-ink/50">
            <tr>
              <th className="py-1 text-left">Fecha</th>
              <th className="py-1 text-left">Pago</th>
              <th className="py-1 text-left">Estado</th>
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
                  {STATUS[p.status] ?? p.status}
                  {p.periodEnd && <span className="block text-xs text-ink/50">hasta {day(p.periodEnd)}</span>}
                  {p.status === "reported" && (
                    <span className="mt-1 flex gap-sp-2 text-xs font-semibold">
                      <button type="button" disabled={busy} onClick={() => decide(p.id, "confirm")} className="text-coral hover:underline">
                        Confirmar
                      </button>
                      <button type="button" disabled={busy} onClick={() => decide(p.id, "reject")} className="text-ink/60 hover:underline">
                        No lo encuentro
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
