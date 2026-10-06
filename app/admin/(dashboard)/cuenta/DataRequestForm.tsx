"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { DATA_REQUEST_KINDS } from "@/lib/data-requests";
import { pickLabel } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

/** Descargar mis datos y pedirle algo al equipo de Datos (copia, recuperar, borrar). */
export default function DataRequestForm() {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [kind, setKind] = useState<string>("recover");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = DATA_REQUEST_KINDS.find((k) => k.id === kind);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (kind === "delete" && !window.confirm(t("¿Seguro? Pedirás borrar tu cuenta y todos tus datos para siempre.", "Are you sure? You'll be asking to delete your account and all your data forever."))) return;
    setBusy(true);
    const response = await fetch("/api/admin/data/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, detail }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo enviar", "Couldn't send"));
    showToast("success", t("Pedido enviado. Te avisamos por correo cuando esté listo.", "Request sent. We'll email you when it's ready."));
    setDetail("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="flex flex-wrap items-center gap-sp-3">
        <a href="/api/admin/data/export" className={secondaryButtonClass} download>
          {t("⬇️ Descargar mis datos", "⬇️ Download my data")}
        </a>
        <span className="text-xs text-ink/60">
          {t("Un archivo con todo lo que guardamos de tu cuenta (sin contraseñas ni llaves de tus redes).", "A file with everything we store about your account (no passwords or social network keys).")}
        </span>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-sp-3 border-t border-line pt-sp-4">
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">{t("¿Necesitas ayuda con tus datos?", "Need help with your data?")}</span>
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value)}>
            {DATA_REQUEST_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {pickLabel(lang, k)}
              </option>
            ))}
          </select>
          {selected && <span className="text-xs text-ink/60">{lang === "en" ? selected.hintEn : selected.hint}</span>}
        </label>
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">
            {t("Detalles", "Details")} {kind === "recover" ? "" : t("(opcional)", "(optional)")}
          </span>
          <textarea
            className={`${inputClass} min-h-[90px]`}
            maxLength={3000}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={
              kind === "recover"
                ? t("Ej.: Borré sin querer la marca «Glow Co» ayer en la tarde.", "E.g.: I accidentally deleted the brand “Glow Co” yesterday afternoon.")
                : t("Algo que debamos saber", "Anything we should know")
            }
          />
        </label>
        <div>
          <button type="submit" className={primaryButtonClass} disabled={busy}>
            {busy ? t("Enviando…", "Sending…") : t("Enviar pedido", "Send request")}
          </button>
        </div>
      </form>
    </div>
  );
}
