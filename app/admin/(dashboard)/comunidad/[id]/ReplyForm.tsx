"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { LIMITS } from "@/lib/community";

/** Responder (o editar una respuesta, si llega `editing`). */
export default function ReplyForm({ postId, editing, onDone }: { postId: string; editing?: { id: string; body: string }; onDone?: () => void }) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [body, setBody] = useState(editing?.body ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(editing ? `/api/admin/community/replies/${editing.id}` : `/api/admin/community/posts/${postId}/replies`, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo enviar", "Couldn't send"));
    showToast("success", editing ? t("Respuesta actualizada", "Reply updated") : t("¡Respuesta enviada!", "Reply sent!"));
    if (!editing) setBody("");
    onDone?.();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sp-2">
      <textarea
        required
        rows={editing ? 3 : 4}
        minLength={LIMITS.reply.min}
        maxLength={LIMITS.reply.max}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("Comparte lo que sabes, con respeto y ejemplos si puedes…", "Share what you know, respectfully and with examples if you can…")}
        className={inputClass}
        aria-label={t("Tu respuesta", "Your reply")}
      />
      <div className="flex flex-wrap gap-sp-2">
        <button type="submit" disabled={saving || body.trim().length < LIMITS.reply.min} className={primaryButtonClass}>
          {saving ? t("Enviando…", "Sending…") : editing ? t("Guardar", "Save") : t("Responder", "Reply")}
        </button>
        {editing && (
          <button type="button" onClick={onDone} className={secondaryButtonClass}>
            {t("Cancelar", "Cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
