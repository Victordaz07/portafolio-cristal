"use client";

import { useState } from "react";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { pickLabel } from "@/lib/admin-lang";
import { REPORT_REASONS } from "@/lib/community";

/** "Reportar": elige un motivo y, si quieres, cuenta qué pasó. El equipo de Comunidad lo revisa. */
export default function ReportButton({ targetType, targetId, className = "" }: { targetType: "post" | "reply" | "profile"; targetId: string; className?: string }) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    const response = await fetch("/api/admin/community/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason, detail }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo enviar", "Couldn't send"));
    setOpen(false);
    setReason("");
    setDetail("");
    showToast("success", t("Gracias. El equipo de Comunidad lo va a revisar.", "Thanks. The Community team will review it."));
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`text-xs text-ink/40 hover:text-red-600 ${className}`}>
        {t("Reportar", "Report")}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 px-sp-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-[18px] bg-white p-sp-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-fraunces text-xl font-semibold text-ink">{t("¿Qué pasa con esto?", "What's wrong with this?")}</h3>
            <p className="mt-1 text-sm text-ink/60">{t("Tu reporte es anónimo: la otra persona no sabe quién lo envió.", "Your report is anonymous: the other person won't know who sent it.")}</p>
            <div className="mt-sp-3 flex flex-col gap-sp-2">
              {REPORT_REASONS.map((r) => (
                <label key={r.id} className={`flex cursor-pointer items-center gap-sp-2 rounded-[12px] border px-sp-3 py-sp-2 text-sm ${reason === r.id ? "border-ink" : "border-line"}`}>
                  <input type="radio" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} />
                  {pickLabel(lang, r)}
                </label>
              ))}
            </div>
            <textarea
              rows={3}
              maxLength={1000}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={t("Cuéntanos un poco más (opcional)", "Tell us a bit more (optional)")}
              className={`${inputClass} mt-sp-3 w-full`}
            />
            <div className="mt-sp-4 flex justify-end gap-sp-2">
              <button type="button" onClick={() => setOpen(false)} className={secondaryButtonClass}>
                {t("Cancelar", "Cancel")}
              </button>
              <button type="button" disabled={!reason || busy} onClick={send} className={primaryButtonClass}>
                {busy ? t("Enviando…", "Sending…") : t("Enviar reporte", "Send report")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
