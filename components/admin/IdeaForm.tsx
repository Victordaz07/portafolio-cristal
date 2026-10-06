"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/admin-ui";
import { IDEA_CATEGORIES } from "@/lib/ideas";
import { pickLabel } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

/** Formulario de idea: la usan las cuentas (sugerencias) y el equipo (ideas internas). */
export default function IdeaForm({ url, submitLabel, placeholder }: { url: string; submitLabel: string; placeholder: string }) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("otro");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo enviar", "Couldn't send"));
    showToast("success", t("¡Idea enviada! Gracias 💜", "Idea sent! Thank you 💜"));
    setTitle("");
    setDescription("");
    setCategory("otro");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sp-3">
      <div className="grid gap-sp-3 md:grid-cols-[2fr_1fr]">
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">{t("Tu idea en una frase", "Your idea in one sentence")}</span>
          <input className={inputClass} required minLength={3} maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={placeholder} />
        </label>
        <label className={labelClass}>
          <span className="text-sm font-semibold text-ink">{t("Tema", "Topic")}</span>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {IDEA_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {pickLabel(lang, c)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={labelClass}>
        <span className="text-sm font-semibold text-ink">{t("Cuéntanos más (opcional)", "Tell us more (optional)")}</span>
        <textarea className={`${inputClass} min-h-[90px]`} maxLength={3000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("¿Qué problema te resolvería? ¿Cómo te lo imaginas?", "What problem would it solve for you? How do you imagine it?")} />
      </label>
      <div>
        <button type="submit" className={primaryButtonClass} disabled={busy}>
          {busy ? t("Enviando…", "Sending…") : submitLabel}
        </button>
      </div>
    </form>
  );
}
