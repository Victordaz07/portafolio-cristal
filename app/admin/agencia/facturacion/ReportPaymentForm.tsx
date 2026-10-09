"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/admin-ui";

export default function ReportPaymentForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState<1 | 3 | 12>(1);
  const [method, setMethod] = useState<"paypal" | "transfer" | "other">("paypal");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const amountCents = Math.round(parseFloat(amount) * 100);
    const response = await fetch("/api/admin/agency/billing/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents, months, method, reference: reference || undefined }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "No se pudo avisar el pago");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) return <p className="text-sm text-ink">✅ Avisado. Lo confirmamos en cuanto lo veamos y te llega un correo.</p>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-3">
      <div className="grid gap-sp-3 md:grid-cols-3">
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">Monto pagado (USD)</span>
          <input className={inputClass} type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="49.00" />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">Meses</span>
          <select className={inputClass} value={months} onChange={(e) => setMonths(Number(e.target.value) as 1 | 3 | 12)}>
            <option value={1}>1 mes</option>
            <option value={3}>3 meses</option>
            <option value={12}>12 meses</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">Método</span>
          <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value as "paypal" | "transfer" | "other")}>
            <option value="paypal">PayPal</option>
            <option value="transfer">Transferencia</option>
            <option value="other">Otro</option>
          </select>
        </label>
      </div>
      <label className={labelClass}>
        <span className="text-sm font-semibold text-ink">Referencia (opcional)</span>
        <input className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="ID de la transacción" />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${primaryButtonClass} self-start`}>
        {busy ? "Avisando…" : "Ya pagué: avisar"}
      </button>
    </form>
  );
}
