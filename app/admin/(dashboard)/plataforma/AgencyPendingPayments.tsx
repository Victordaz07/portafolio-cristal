"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";

export interface AgencyPendingPayment {
  id: string;
  agencyName: string;
  amount: string;
  method: string;
  reference: string | null;
  createdAt: string;
}

/** Igual que PendingPayments.tsx, pero para los pagos que reportan las agencias (plan Crew). */
export default function AgencyPendingPayments({ payments }: { payments: AgencyPendingPayment[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(p: AgencyPendingPayment, action: "confirm" | "reject") {
    if (!window.confirm(action === "confirm" ? `¿Confirmas que recibiste ${p.amount} de ${p.agencyName}?` : `¿No encontraste el pago de ${p.agencyName}?`)) return;
    setBusy(p.id);
    const response = await fetch(`/api/admin/platform/agency-payments/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      showToast("error", body.error ?? "No se pudo actualizar");
      return;
    }
    showToast("success", action === "confirm" ? "Pago confirmado" : "Pago marcado como no encontrado");
    router.refresh();
  }

  if (payments.length === 0) return null;
  return (
    <Card>
      <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Pagos de agencias por confirmar</p>
      <ul className="flex flex-col gap-sp-3">
        {payments.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-sp-3 rounded-[12px] border border-line p-sp-3 text-sm">
            <div>
              <span className="font-semibold text-ink">{p.agencyName}</span> · <strong>{p.amount}</strong> · {p.method}
              <span className="block text-xs text-ink/55">Ref.: {p.reference || "—"} · {new Date(p.createdAt).toLocaleString("es-DO")}</span>
            </div>
            <div className="flex gap-sp-2 text-xs font-semibold">
              <button type="button" disabled={busy === p.id} onClick={() => decide(p, "confirm")} className="rounded-full bg-ink px-sp-3 py-1.5 text-cream hover:bg-coral disabled:opacity-50">
                Confirmar
              </button>
              <button type="button" disabled={busy === p.id} onClick={() => decide(p, "reject")} className="rounded-full border border-line px-sp-3 py-1.5 text-ink/70 hover:border-red-400 hover:text-red-600 disabled:opacity-50">
                No lo encuentro
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
