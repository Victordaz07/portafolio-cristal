"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { impersonate, setStatus } from "../AccountsTable";
import { useT } from "@/components/admin/AdminLang";

export default function AccountActions({
  creatorId,
  name,
  status,
  note,
  isMine,
  siteUrl,
  twoFactor = false,
}: {
  creatorId: string;
  name: string;
  status: string;
  note: string;
  isMine: boolean;
  siteUrl: string;
  /** La cuenta tiene activa la verificación en dos pasos. */
  twoFactor?: boolean;
}) {
  const { t } = useT();
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
    if (!response.ok) return showToast("error", t("No se pudo guardar la nota", "Couldn't save the note"));
    showToast("success", t("Nota guardada", "Note saved"));
    router.refresh();
  }

  async function enterAs() {
    if (!window.confirm(t(`¿Entrar al panel de ${name} para darle soporte? Queda registrado.`, `Enter ${name}'s dashboard to give support? This is logged.`))) return;
    setBusy(true);
    const error = await impersonate(creatorId);
    if (error) {
      setBusy(false);
      return showToast("error", error);
    }
    router.push("/admin");
    router.refresh();
  }

  async function resetTwoFactor() {
    if (
      !window.confirm(
        t(
          `¿Quitar la verificación en dos pasos de ${name}? Hazlo solo si confirmaste que es ella (por ejemplo, te escribe desde su correo de siempre). Queda registrado y le llega un aviso.`,
          `Remove two-step verification from ${name}? Only do this if you've confirmed it's really them (for example, they write from their usual email). This is logged and they get a notice.`
        )
      )
    )
      return;
    setBusy(true);
    const response = await fetch(`/api/admin/platform/creators/${creatorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetTwoFactor: true }),
    });
    setBusy(false);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo quitar", "Couldn't remove it"));
    showToast("success", t("Verificación en dos pasos quitada", "Two-step verification removed"));
    router.refresh();
  }

  async function toggle() {
    const pause = status === "active";
    if (
      !window.confirm(
        pause
          ? t(
              `¿Pausar la cuenta de ${name}? Su sitio deja de verse y no puede entrar al panel. No se borra nada.`,
              `Pause ${name}'s account? Their site goes offline and they can't sign in. Nothing is deleted.`
            )
          : t(`¿Reactivar la cuenta de ${name}?`, `Reactivate ${name}'s account?`)
      )
    )
      return;
    setBusy(true);
    const error = await setStatus(creatorId, pause ? "paused" : "active");
    setBusy(false);
    if (error) return showToast("error", error);
    showToast("success", pause ? t("Cuenta pausada", "Account paused") : t("Cuenta reactivada", "Account reactivated"));
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
          {status === "active" ? t("Activa", "Active") : t("Pausada", "Paused")}
        </span>
        <a href={siteUrl} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
          {t("Ver su sitio ↗", "View their site ↗")}
        </a>
        {!isMine && (
          <>
            <button type="button" disabled={busy} onClick={enterAs} className={primaryButtonClass}>
              {t("Entrar como", "Sign in as")} {name.split(" ")[0]}
            </button>
            <button type="button" disabled={busy} onClick={toggle} className={secondaryButtonClass}>
              {status === "active" ? t("Pausar cuenta", "Pause account") : t("Reactivar cuenta", "Reactivate account")}
            </button>
            {twoFactor && (
              <button type="button" disabled={busy} onClick={resetTwoFactor} className={secondaryButtonClass}>
                {t("Quitar verificación en dos pasos", "Remove two-step verification")}
              </button>
            )}
          </>
        )}
      </div>
      <label className="mt-sp-4 flex flex-col gap-sp-1.5">
        <span className="text-sm font-medium text-ink">{t("Nota interna (solo la ves tú)", "Internal note (only you see it)")}</span>
        <textarea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("Ej.: pidió ayuda con su dominio el 3 de octubre; le prometimos 1 mes gratis.", "E.g.: asked for help with their domain on Oct 3; we promised 1 free month.")}
          className={inputClass}
          maxLength={2000}
        />
      </label>
      <button type="button" disabled={busy || draft === note} onClick={saveNote} className={`${secondaryButtonClass} mt-sp-2`}>
        {t("Guardar nota", "Save note")}
      </button>
    </Card>
  );
}
