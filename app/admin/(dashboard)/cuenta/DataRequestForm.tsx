"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { DATA_REQUEST_KINDS } from "@/lib/data-export";

/** Descargar mis datos y pedirle algo al equipo de Datos (copia, recuperar, borrar). */
export default function DataRequestForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [kind, setKind] = useState<string>("recover");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = DATA_REQUEST_KINDS.find((k) => k.id === kind);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (kind === "delete" && !window.confirm("¿Seguro? Pedirás borrar tu cuenta y todos tus datos para siempre.")) return;
    setBusy(true);
    const response = await fetch("/api/admin/data/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, detail }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? "No se pudo enviar");
    showToast("success", "Pedido enviado. Te avisamos por correo cuando esté listo.");
    setDetail("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="flex flex-wrap items-center gap-sp-3">
        <a href="/api/admin/data/export" className={secondaryButtonClass} download>
          ⬇️ Descargar mis datos
        </a>
        <span className="text-xs text-ink/60">Un archivo con todo lo que guardamos de tu cuenta (sin contraseñas ni llaves de tus redes).</span>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-sp-3 border-t border-line pt-sp-4">
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">¿Necesitas ayuda con tus datos?</span>
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value)}>
            {DATA_REQUEST_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
          {selected && <span className="text-xs text-ink/60">{selected.hint}</span>}
        </label>
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">Detalles {kind === "recover" ? "" : "(opcional)"}</span>
          <textarea
            className={`${inputClass} min-h-[90px]`}
            maxLength={3000}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={kind === "recover" ? "Ej.: Borré sin querer la marca «Glow Co» ayer en la tarde." : "Algo que debamos saber"}
          />
        </label>
        <div>
          <button type="submit" className={primaryButtonClass} disabled={busy}>
            {busy ? "Enviando…" : "Enviar pedido"}
          </button>
        </div>
      </form>
    </div>
  );
}
