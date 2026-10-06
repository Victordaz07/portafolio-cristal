"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { LIMITS, type ConnectionState } from "@/lib/community";

/** Conectar con alguien de la comunidad: pedir, cancelar, aceptar, rechazar o quitar la conexión. */
export default function ConnectButton({
  handle,
  name,
  state,
  connectionId,
  compact = false,
}: {
  handle: string;
  name: string;
  state: ConnectionState;
  connectionId?: string | null;
  compact?: boolean;
}) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [asking, setAsking] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: unknown, success?: string) {
    setBusy(true);
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; state?: ConnectionState };
    setBusy(false);
    if (!response.ok) {
      showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
      return null;
    }
    if (success) showToast("success", success);
    router.refresh();
    return data;
  }

  async function request() {
    const data = await call("/api/admin/community/connections", "POST", { handle, note });
    if (!data) return;
    setAsking(false);
    setNote("");
    showToast(
      "success",
      data.state === "connected" ? t(`¡Ya estás conectado con ${name}!`, `You're now connected with ${name}!`) : t(`Solicitud enviada a ${name}`, `Request sent to ${name}`)
    );
  }

  const size = compact ? "px-sp-3 py-1 text-xs" : "px-sp-4 py-sp-2 text-sm";
  const link = "text-xs text-ink/50 hover:text-coral disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-sp-2">
      {state === "none" && (
        <button type="button" disabled={busy} onClick={() => setAsking(true)} className={`rounded-full bg-ink font-semibold text-cream hover:bg-coral disabled:opacity-50 ${size}`}>
          {t("+ Conectar", "+ Connect")}
        </button>
      )}
      {state === "outgoing" && (
        <>
          <span className={`rounded-full border border-line bg-cream font-semibold text-ink/60 ${size}`}>{t("Solicitud enviada", "Request sent")}</span>
          {connectionId && (
            <button type="button" disabled={busy} onClick={() => call(`/api/admin/community/connections/${connectionId}`, "DELETE", undefined, t("Solicitud cancelada", "Request canceled"))} className={link}>
              {t("Cancelar", "Cancel")}
            </button>
          )}
        </>
      )}
      {state === "incoming" && connectionId && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => call(`/api/admin/community/connections/${connectionId}`, "PATCH", { action: "accept" }, t(`¡Ya estás conectado con ${name}!`, `You're now connected with ${name}!`))}
            className={`rounded-full bg-ink font-semibold text-cream hover:bg-coral disabled:opacity-50 ${size}`}
          >
            {t("Aceptar", "Accept")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => call(`/api/admin/community/connections/${connectionId}`, "PATCH", { action: "decline" }, t("Solicitud rechazada", "Request declined"))}
            className={`rounded-full border border-line bg-white font-semibold text-ink/70 hover:border-coral disabled:opacity-50 ${size}`}
          >
            {t("Rechazar", "Decline")}
          </button>
        </>
      )}
      {state === "connected" && (
        <>
          <span className={`rounded-full bg-lime/30 font-semibold text-moss ${size}`}>{t("✓ Conectados", "✓ Connected")}</span>
          {connectionId && !compact && (
            <button type="button" disabled={busy} onClick={() => setRemoving(true)} className={link}>
              {t("Quitar conexión", "Remove connection")}
            </button>
          )}
        </>
      )}

      {asking && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 px-sp-4" onClick={() => setAsking(false)}>
          <div className="w-full max-w-md rounded-[18px] bg-white p-sp-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-fraunces text-xl font-semibold text-ink">{t(`Conectar con ${name}`, `Connect with ${name}`)}</h3>
            <p className="mt-1 text-sm text-ink/60">
              {t("Si acepta, podrán escribirse mensajes. Cuéntale por qué quieres conectar (opcional).", "If they accept, you'll be able to message each other. Tell them why you want to connect (optional).")}
            </p>
            <textarea
              rows={3}
              maxLength={LIMITS.connectionNote}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("Ej.: Me encantó tu consejo sobre ganchos. ¿Hacemos un colab?", "E.g.: Loved your tip about hooks. Want to collab?")}
              className={`${inputClass} mt-sp-3 w-full`}
            />
            <p className="mt-1 text-right text-[11px] text-ink/40">
              {note.length}/{LIMITS.connectionNote}
            </p>
            <div className="mt-sp-3 flex justify-end gap-sp-2">
              <button type="button" onClick={() => setAsking(false)} className={secondaryButtonClass}>
                {t("Cancelar", "Cancel")}
              </button>
              <button type="button" disabled={busy} onClick={request} className={primaryButtonClass}>
                {busy ? t("Enviando…", "Sending…") : t("Enviar solicitud", "Send request")}
              </button>
            </div>
          </div>
        </div>
      )}
      {removing && connectionId && (
        <ConfirmDialog
          title={t(`¿Quitar la conexión con ${name}?`, `Remove your connection with ${name}?`)}
          description={t("Ya no podrán escribirse mensajes. No se le avisa.", "You won't be able to message each other anymore. They aren't notified.")}
          confirmLabel={t("Quitar", "Remove")}
          onConfirm={() => {
            setRemoving(false);
            call(`/api/admin/community/connections/${connectionId}`, "DELETE", undefined, t("Conexión quitada", "Connection removed"));
          }}
          onCancel={() => setRemoving(false)}
        />
      )}
    </div>
  );
}
