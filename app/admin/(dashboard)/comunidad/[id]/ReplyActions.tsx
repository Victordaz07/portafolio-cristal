"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReplyForm from "./ReplyForm";

/** Acciones de una respuesta: editar/borrar (si es mía) y elegir como mejor (si soy quien preguntó). */
export default function ReplyActions({
  postId,
  replyId,
  body,
  mine,
  canEdit,
  canPickBest,
  isBest,
}: {
  postId: string;
  replyId: string;
  body: string;
  mine: boolean;
  canEdit: boolean;
  canPickBest: boolean;
  isBest: boolean;
}) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function call(url: string, init: RequestInit, ok: string) {
    setBusy(true);
    const response = await fetch(url, init);
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", ok);
    router.refresh();
  }

  const pickBest = () =>
    call(
      `/api/admin/community/posts/${postId}/best`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ replyId: isBest ? null : replyId }) },
      isBest ? t("Ya no es la mejor respuesta", "No longer the best answer") : t("¡Marcada como mejor respuesta!", "Marked as best answer!")
    );

  return (
    <>
      <span className="ml-auto flex flex-wrap gap-sp-3 text-xs font-semibold">
        {canPickBest && (
          <button type="button" disabled={busy} onClick={pickBest} className="text-moss hover:underline">
            {isBest ? t("Quitar mejor respuesta", "Unmark best answer") : t("✓ Mejor respuesta", "✓ Best answer")}
          </button>
        )}
        {mine && canEdit && (
          <button type="button" onClick={() => setEditing(true)} className="text-coral hover:underline">
            {t("Editar", "Edit")}
          </button>
        )}
        {mine && (
          <button type="button" onClick={() => setConfirming(true)} className="text-ink/45 hover:text-red-600">
            {t("Borrar", "Delete")}
          </button>
        )}
      </span>
      {editing && (
        <div className="basis-full pt-sp-2">
          <ReplyForm postId={postId} editing={{ id: replyId, body }} onDone={() => setEditing(false)} />
        </div>
      )}
      {confirming && (
        <ConfirmDialog
          title={t("Borrar respuesta", "Delete reply")}
          description={t("Se borra para todos. No se puede deshacer.", "It's deleted for everyone. This can't be undone.")}
          onConfirm={() => {
            setConfirming(false);
            call(`/api/admin/community/replies/${replyId}`, { method: "DELETE" }, t("Respuesta borrada", "Reply deleted"));
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
