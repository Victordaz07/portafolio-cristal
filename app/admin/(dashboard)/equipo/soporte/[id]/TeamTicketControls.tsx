"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

export default function TeamTicketControls({
  id,
  number,
  status,
  assignedTo,
  me,
  creatorId,
  accountName,
  canImpersonate,
}: {
  id: string;
  number: number;
  status: string;
  assignedTo: string | null;
  me: string;
  creatorId: string;
  accountName: string;
  canImpersonate: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState(`Ticket #${number}: `);

  async function patch(body: Record<string, string>, ok: string) {
    setBusy(true);
    const response = await fetch(`/api/admin/team/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) return showToast("error", "No se pudo actualizar");
    showToast("success", ok);
    router.refresh();
  }

  async function enterAs() {
    setBusy(true);
    const response = await fetch("/api/admin/platform/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId, reason }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setBusy(false);
      return showToast("error", data.error ?? "No se pudo entrar");
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="flex flex-wrap items-center gap-sp-2">
        <span className="text-sm font-semibold text-ink">Estado:</span>
        {[
          ["open", "Abierto"],
          ["waiting", "Esperando a la cuenta"],
          ["closed", "Cerrado"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={busy || status === value}
            onClick={() => patch({ status: value }, `Ticket marcado como «${label}»`)}
            className={`rounded-full border px-sp-3 py-1 text-xs font-semibold ${status === value ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink hover:border-coral"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-sp-2 text-sm">
        <span className="font-semibold text-ink">Atiende:</span>
        <span className="text-ink/70">{assignedTo ?? "Sin asignar"}</span>
        {assignedTo !== me && (
          <button type="button" className={secondaryButtonClass} disabled={busy} onClick={() => patch({ assignedTo: me }, "Ahora lo atiendes tú")}>
            Asignármelo
          </button>
        )}
        {assignedTo && (
          <button type="button" className="text-xs text-ink/60 underline" disabled={busy} onClick={() => patch({ assignedTo: "" }, "Ticket sin asignar")}>
            Quitar asignación
          </button>
        )}
      </div>
      {canImpersonate && (
        <div className="flex flex-col gap-sp-2 rounded-[14px] border border-line bg-cream/60 p-sp-3">
          <p className="text-sm font-semibold text-ink">🛟 Entrar al panel de {accountName}</p>
          <p className="text-xs text-ink/60">Escribe el motivo: queda registrado y la cuenta lo ve en «Mi cuenta». Todo lo que cambies se guarda en su cuenta.</p>
          <div className="flex flex-wrap gap-sp-2">
            <input className={`${inputClass} min-w-[240px] flex-1`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} aria-label="Motivo" />
            <button type="button" className={primaryButtonClass} disabled={busy || reason.trim().length < 5} onClick={enterAs}>
              Entrar como
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
