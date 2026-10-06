"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { secondaryButtonClass } from "@/lib/admin-ui";

/** Publicar la pregunta de la semana ahora (la escribe la IA en español e inglés y queda fijada). */
export default function WeeklyQuestionButton() {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!window.confirm(t("¿Publicar una pregunta de la semana nueva? Reemplaza la que está fijada.", "Post a new question of the week? It replaces the pinned one."))) return;
    setBusy(true);
    const response = await fetch("/api/admin/team/community/weekly", { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as { error?: string; id?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo publicar", "Couldn't post"));
    showToast("success", t("Pregunta publicada y fijada en el muro", "Question posted and pinned on the wall"));
    router.push(`/admin/comunidad/${data.id}`);
  }

  return (
    <button type="button" onClick={run} disabled={busy} className={secondaryButtonClass}>
      {busy ? t("Escribiendo…", "Writing…") : t("✨ Publicar la pregunta de la semana", "✨ Post the question of the week")}
    </button>
  );
}
