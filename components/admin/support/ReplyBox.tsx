"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";

/** Caja para responder un ticket. Con `allowInternal`, el equipo puede dejar una nota interna. */
export default function ReplyBox({ url, allowInternal = false, placeholder = "Escribe tu respuesta…" }: { url: string; allowInternal?: boolean; placeholder?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allowInternal ? { message, internal } : { message }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? "No se pudo enviar");
    showToast("success", internal ? "Nota interna guardada" : "Respuesta enviada");
    setMessage("");
    setInternal(false);
    router.refresh();
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-sp-2">
      <textarea
        className={`${inputClass} min-h-[110px] ${internal ? "border-lime bg-lime/10" : ""}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={internal ? "Nota interna: solo la ve el equipo…" : placeholder}
        maxLength={5000}
        aria-label="Mensaje"
      />
      <div className="flex flex-wrap items-center justify-between gap-sp-3">
        {allowInternal ? (
          <label className="flex items-center gap-sp-2 text-sm text-ink/70">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
            Nota interna (la cuenta no la ve)
          </label>
        ) : (
          <span />
        )}
        <button type="submit" className={primaryButtonClass} disabled={busy || !message.trim()}>
          {busy ? "Enviando…" : internal ? "Guardar nota" : "Enviar"}
        </button>
      </div>
    </form>
  );
}
