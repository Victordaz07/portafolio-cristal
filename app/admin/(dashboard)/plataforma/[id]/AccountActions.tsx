"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { impersonate, setStatus } from "../AccountsTable";

export default function AccountActions({
  creatorId,
  name,
  status,
  note,
  isMine,
  siteUrl,
}: {
  creatorId: string;
  name: string;
  status: string;
  note: string;
  isMine: boolean;
  siteUrl: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [draft, setDraft] = useState(note);
  const [busy, setBusy] = useState(false);

  async function saveNote() {
    setBusy(true);
    const response = await fetch(`/api/admin/platform/creators/${creatorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: draft }),
    });
    setBusy(false);
    if (!response.ok) return showToast("error", "No se pudo guardar la nota");
    showToast("success", "Nota guardada");
    router.refresh();
  }

  async function enterAs() {
    if (!window.confirm(`¿Entrar al panel de ${name} para darle soporte? Queda registrado.`)) return;
    setBusy(true);
    const error = await impersonate(creatorId);
    if (error) {
      setBusy(false);
      return showToast("error", error);
    }
    router.push("/admin");
    router.refresh();
  }

  async function toggle() {
    const pause = status === "active";
    if (
      !window.confirm(
        pause
          ? `¿Pausar la cuenta de ${name}? Su sitio deja de verse y no puede entrar al panel. No se borra nada.`
          : `¿Reactivar la cuenta de ${name}?`
      )
    )
      return;
    setBusy(true);
    const error = await setStatus(creatorId, pause ? "paused" : "active");
    setBusy(false);
    if (error) return showToast("error", error);
    showToast("success", pause ? "Cuenta pausada" : "Cuenta reactivada");
    router.refresh();
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-sp-3">
        <span
          className={`rounded-full px-[10px] py-1 font-mono text-[11px] uppercase ${
            status === "active" ? "bg-sage/30 text-cobalt-ink" : "bg-red-50 text-red-700"
          }`}
        >
          {status === "active" ? "Activa" : "Pausada"}
        </span>
        <a href={siteUrl} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
          Ver su sitio ↗
        </a>
        {!isMine && (
          <>
            <button type="button" disabled={busy} onClick={enterAs} className={primaryButtonClass}>
              Entrar como {name.split(" ")[0]}
            </button>
            <button type="button" disabled={busy} onClick={toggle} className={secondaryButtonClass}>
              {status === "active" ? "Pausar cuenta" : "Reactivar cuenta"}
            </button>
          </>
        )}
      </div>
      <label className="mt-sp-4 flex flex-col gap-sp-1.5">
        <span className="text-sm font-medium text-ink">Nota interna (solo la ves tú)</span>
        <textarea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ej.: pidió ayuda con su dominio el 3 de octubre; le prometimos 1 mes gratis."
          className={inputClass}
          maxLength={2000}
        />
      </label>
      <button type="button" disabled={busy || draft === note} onClick={saveNote} className={`${secondaryButtonClass} mt-sp-2`}>
        Guardar nota
      </button>
    </Card>
  );
}
