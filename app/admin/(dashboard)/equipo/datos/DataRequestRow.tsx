"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { DATA_REQUEST_STATUS, dataRequestKindLabel } from "@/lib/data-requests";

type Request = {
  id: string;
  kind: string;
  detail: string;
  status: string;
  requestedBy: string;
  handledBy: string | null;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  creatorId: string;
  account: string;
};

export default function DataRequestRow({ request: r }: { request: Request }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [resolution, setResolution] = useState(r.resolution ?? "");
  const [busy, setBusy] = useState(false);
  const status = DATA_REQUEST_STATUS[r.status] ?? DATA_REQUEST_STATUS.open;

  async function save(next: "open" | "done" | "rejected") {
    setBusy(true);
    const response = await fetch(`/api/admin/team/data/requests/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, resolution }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? "No se pudo guardar");
    showToast("success", next === "open" ? "Pedido reabierto" : "Listo. Le avisamos a la cuenta por correo.");
    router.refresh();
  }

  return (
    <li className="flex flex-col gap-sp-2 border-t border-line pt-sp-4 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-sp-2">
        <span className={`font-semibold ${r.kind === "delete" ? "text-red-700" : "text-ink"}`}>{dataRequestKindLabel(r.kind)}</span>
        <span className={`rounded-full px-[8px] py-px font-mono text-[10px] uppercase ${status.tone}`}>{status.label}</span>
        <span className="text-sm text-ink/70">
          {r.account} · {r.requestedBy}
        </span>
        <span className="font-mono text-xs text-ink/50">{r.createdAt}</span>
      </div>
      {r.detail && <p className="whitespace-pre-wrap rounded-[10px] bg-cream px-sp-3 py-sp-2 text-sm text-ink">{r.detail}</p>}
      {r.status === "open" ? (
        <>
          <textarea
            className={`${inputClass} min-h-[70px]`}
            maxLength={2000}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Qué se hizo (la cuenta lo recibe por correo). Ej.: Te mandamos la copia a tu correo."
          />
          <div className="flex flex-wrap gap-sp-2">
            <a href={`/api/admin/team/data/export/${r.creatorId}`} className={secondaryButtonClass} download>
              ⬇️ Copia de la cuenta
            </a>
            <button type="button" className={primaryButtonClass} disabled={busy} onClick={() => save("done")}>
              Marcar resuelto
            </button>
            <button type="button" className={secondaryButtonClass} disabled={busy} onClick={() => save("rejected")}>
              No se puede
            </button>
          </div>
          {r.kind === "delete" && (
            <p className="text-xs text-red-700">
              Borrar una cuenta lo hace el Dueño, a mano. Antes, confirma por correo que la persona de verdad lo pidió.
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-sp-2 text-sm text-ink/70">
          <span>
            💬 {r.resolution} — {r.handledBy} · {r.resolvedAt}
          </span>
          <button type="button" className="text-xs font-semibold text-coral hover:underline" disabled={busy} onClick={() => save("open")}>
            Reabrir
          </button>
        </div>
      )}
    </li>
  );
}
