"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";

/** Acciones del equipo sobre un contenido reportado. */
export default function ModerationActions({ reportId, canHide, hidden }: { reportId: string; canHide: boolean; hidden: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function run(action: "hide" | "show" | "dismiss" | "mute", days?: 1 | 7 | 30) {
    const confirmText =
      action === "hide"
        ? t("¿Ocultar este contenido? La persona recibe un correo.", "Hide this content? The person gets an email.")
        : action === "mute"
          ? t(`¿Pausar a esta cuenta ${days} día(s)? No podrá publicar ni responder, y recibe un correo.`, `Pause this account for ${days} day(s)? They won't be able to post or reply, and they get an email.`)
          : null;
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    const response = await fetch(`/api/admin/team/community/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, days }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", t("Listo", "Done"));
    router.refresh();
  }

  const btn = "rounded-full border px-sp-3 py-1.5 text-xs font-semibold transition disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-sp-2 border-t border-line pt-sp-3">
      {canHide &&
        (hidden ? (
          <button type="button" disabled={busy} onClick={() => run("show")} className={`${btn} border-line text-ink/70 hover:border-coral`}>
            {t("Volver a mostrar", "Show again")}
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => run("hide")} className={`${btn} border-red-300 bg-red-50 text-red-700 hover:bg-red-100`}>
            {t("Ocultar", "Hide")}
          </button>
        ))}
      <button type="button" disabled={busy} onClick={() => run("dismiss")} className={`${btn} border-line text-ink/70 hover:border-coral`}>
        {t("No procede (descartar)", "Not valid (dismiss)")}
      </button>
      {([1, 7, 30] as const).map((d) => (
        <button key={d} type="button" disabled={busy} onClick={() => run("mute", d)} className={`${btn} border-line text-ink/70 hover:border-red-300`}>
          {t(`Pausar ${d} d`, `Pause ${d}d`)}
        </button>
      ))}
    </div>
  );
}
