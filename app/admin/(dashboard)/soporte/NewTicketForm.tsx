"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/admin-ui";
import { SUPPORT_CATEGORIES } from "@/lib/support";

export default function NewTicketForm() {
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
    if (!response.ok || !data.id) return showToast("error", data.error ?? "No se pudo enviar");
    showToast("success", `Ticket #${data.number} enviado. Te avisamos por correo cuando respondamos.`);
    router.push(`/admin/soporte/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sp-3">
      <div className="grid gap-sp-3 md:grid-cols-[2fr_1fr]">
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">Asunto</span>
          <input className={inputClass} required minLength={3} maxLength={140} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej.: No puedo conectar mi Instagram" />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">Tema</span>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {SUPPORT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={labelClass}>
        <span className="text-sm font-semibold text-ink">Cuéntanos qué pasa</span>
        <textarea
          className={`${inputClass} min-h-[140px]`}
          required
          minLength={5}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Qué intentabas hacer, qué esperabas que pasara y qué pasó (si hay un mensaje de error, cópialo)."
        />
      </label>
      <div>
        <button type="submit" className={primaryButtonClass} disabled={busy}>
          {busy ? "Enviando…" : "Enviar a soporte"}
        </button>
      </div>
    </form>
  );
}
