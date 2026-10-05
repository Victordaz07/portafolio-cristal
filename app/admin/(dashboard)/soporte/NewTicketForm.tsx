"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/admin-ui";
import { SUPPORT_CATEGORIES } from "@/lib/support";
import { pickLabel } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

export default function NewTicketForm() {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>("otro");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, category, message }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; id?: string; number?: number };
    setBusy(false);
    if (!response.ok || !data.id) return showToast("error", data.error ?? t("No se pudo enviar", "Couldn't send"));
    showToast("success", t(`Ticket #${data.number} enviado. Te avisamos por correo cuando respondamos.`, `Ticket #${data.number} sent. We'll email you when we reply.`));
    router.push(`/admin/soporte/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sp-3">
      <div className="grid gap-sp-3 md:grid-cols-[2fr_1fr]">
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">{t("Asunto", "Subject")}</span>
          <input className={inputClass} required minLength={3} maxLength={140} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("Ej.: No puedo conectar mi Instagram", "E.g.: I can't connect my Instagram")} />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">{t("Tema", "Topic")}</span>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {SUPPORT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {pickLabel(lang, c)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={labelClass}>
        <span className="text-sm font-semibold text-ink">{t("Cuéntanos qué pasa", "Tell us what's going on")}</span>
        <textarea
          className={`${inputClass} min-h-[140px]`}
          required
          minLength={5}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("Qué intentabas hacer, qué esperabas que pasara y qué pasó (si hay un mensaje de error, cópialo).", "What you were trying to do, what you expected and what happened (if there's an error message, copy it).")}
        />
      </label>
      <div>
        <button type="submit" className={primaryButtonClass} disabled={busy}>
          {busy ? t("Enviando…", "Sending…") : t("Enviar a soporte", "Send to support")}
        </button>
      </div>
    </form>
  );
}
