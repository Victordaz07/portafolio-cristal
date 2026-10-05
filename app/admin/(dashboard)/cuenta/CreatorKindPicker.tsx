"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { CREATOR_KINDS, type CreatorKind } from "@/lib/creator-kind";
import { pickLabel } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

/** "¿Cómo trabajas con marcas?": orienta la IA (captions, ideas, diseño) y las plantillas. */
export default function CreatorKindPicker({ initial }: { initial: CreatorKind }) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [kind, setKind] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function choose(next: CreatorKind) {
    if (next === kind || saving) return;
    const previous = kind;
    setKind(next);
    setSaving(true);
    const response = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorKind: next }),
    });
    setSaving(false);
    if (!response.ok) {
      setKind(previous);
      return showToast("error", t("No se pudo guardar", "Couldn't save"));
    }
    showToast("success", t("Guardado. La IA ya lo tiene en cuenta.", "Saved. The AI now takes it into account."));
    router.refresh();
  }

  return (
    <Card>
      <p className="mb-sp-1 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Cómo trabajas con marcas", "How you work with brands")}</p>
      <p className="mb-sp-3 text-xs text-ink/55">
        {t("Orienta las sugerencias de la IA. Tus textos no cambian solos: los editas en Portada, Servicios, Paquetes y Preguntas.", "Guides the AI suggestions. Your texts don't change on their own: you edit them in Cover, Services, Packages and FAQ.")}
      </p>
      <div className="grid gap-sp-2 sm:grid-cols-3" role="radiogroup" aria-label={t("Cómo trabajas con marcas", "How you work with brands")}>
        {CREATOR_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="radio"
            aria-checked={kind === k.id}
            disabled={saving}
            onClick={() => choose(k.id)}
            className={`flex flex-col gap-1 rounded-[14px] border p-sp-3 text-left transition ${
              kind === k.id ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink hover:border-coral"
            }`}
          >
            <span className="text-sm font-semibold">{pickLabel(lang, k)}</span>
            <span className={`text-xs ${kind === k.id ? "text-cream/75" : "text-ink/55"}`}>{lang === "en" ? k.hintEn : k.hint}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
