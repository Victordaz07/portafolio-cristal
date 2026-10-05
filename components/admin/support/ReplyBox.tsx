"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";

/** Caja para responder un ticket. Con `allowInternal`, el equipo puede dejar una nota interna. */
export default function ReplyBox({ url, allowInternal = false, placeholder }: { url: string; allowInternal?: boolean; placeholder?: string }) {
  const { t } = useT();
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
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo enviar", "Couldn't send"));
    showToast("success", internal ? t("Nota interna guardada", "Internal note saved") : t("Respuesta enviada", "Reply sent"));
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
        placeholder={internal ? t("Nota interna: solo la ve el equipo…", "Internal note: only the team sees it…") : placeholder ?? t("Escribe tu respuesta…", "Write your reply…")}
        maxLength={5000}
        aria-label={t("Mensaje", "Message")}
      />
      <div className="flex flex-wrap items-center justify-between gap-sp-3">
        {allowInternal ? (
          <label className="flex items-center gap-sp-2 text-sm text-ink/70">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
            {t("Nota interna (la cuenta no la ve)", "Internal note (the account can't see it)")}
          </label>
        ) : (
          <span />
        )}
        <button type="submit" className={primaryButtonClass} disabled={busy || !message.trim()}>
          {busy ? t("Enviando…", "Sending…") : internal ? t("Guardar nota", "Save note") : t("Enviar", "Send")}
        </button>
      </div>
    </form>
  );
}
