"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/admin-ui";

interface PlanOption {
  id: string;
  name: string;
  prices: Record<1 | 3 | 12, number>;
}

const money = (cents: number) =>
  `US$${(cents / 100).toLocaleString("es-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

export default function PayForm({
  plans,
  defaultPlan,
  paypalUrl,
  hasTransfer,
}: {
  plans: PlanOption[];
  defaultPlan: string;
  paypalUrl: string | null;
  hasTransfer: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [plan, setPlan] = useState(defaultPlan);
  const [months, setMonths] = useState<1 | 3 | 12>(1);
  const [method, setMethod] = useState<"paypal" | "transfer" | "other">(paypalUrl ? "paypal" : hasTransfer ? "transfer" : "other");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const selected = plans.find((p) => p.id === plan) ?? plans[0];
  const amount = selected.prices[months];
  const paypalHref = paypalUrl && /paypal\.me\//i.test(paypalUrl) ? `${paypalUrl}/${(amount / 100).toFixed(amount % 100 ? 2 : 0)}USD` : paypalUrl;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    const response = await fetch("/api/admin/billing/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, months, method, reference, note }),
    });
    setSending(false);
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) return showToast("error", body.error ?? "No se pudo enviar");
    showToast("success", "¡Gracias! Te avisamos por correo cuando lo confirmemos.");
    setReference("");
    setNote("");
    router.refresh();
  }

  return (
    <Card>
      <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Pagar y avisar</p>
      <form onSubmit={submit} className="flex flex-col gap-sp-4">
        <div className="grid gap-sp-4 sm:grid-cols-3">
          <label className={labelClass}>
            <span className="text-sm font-medium text-ink">Plan</span>
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className="text-sm font-medium text-ink">Tiempo</span>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value) as 1 | 3 | 12)} className={inputClass}>
              <option value={1}>1 mes</option>
              <option value={3}>3 meses</option>
              <option value={12}>12 meses (2 de regalo)</option>
            </select>
          </label>
          <label className={labelClass}>
            <span className="text-sm font-medium text-ink">Método</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={inputClass}>
              {paypalUrl && <option value="paypal">PayPal</option>}
              {hasTransfer && <option value="transfer">Transferencia bancaria</option>}
              <option value="other">Otro</option>
            </select>
          </label>
        </div>
        <p className="text-ink">
          Total: <strong className="text-xl">{money(amount)}</strong>
        </p>
        {method === "paypal" && paypalHref && (
          <a href={paypalHref} target="_blank" rel="noreferrer" className={`${primaryButtonClass} w-fit`}>
            Pagar {money(amount)} con PayPal ↗
          </a>
        )}
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">ID de la transacción o número de referencia</span>
          <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} placeholder="Lo encuentras en el recibo de PayPal o del banco" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">Nota (opcional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ej.: pagué desde la cuenta de mi pareja" className={inputClass} />
        </label>
        <button type="submit" disabled={sending} className={`${primaryButtonClass} w-fit`}>
          {sending ? "Enviando…" : "Ya pagué: avisar"}
        </button>
      </form>
    </Card>
  );
}
