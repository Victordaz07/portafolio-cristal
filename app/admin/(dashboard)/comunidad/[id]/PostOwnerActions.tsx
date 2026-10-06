"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import NewPostForm, { type PostFormValues } from "../NewPostForm";

/** Editar (primeros 30 min) o borrar mi publicación. */
export default function PostOwnerActions({ postId, canEdit, values }: { postId: string; canEdit: boolean; values: PostFormValues }) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function remove() {
    setConfirming(false);
    const response = await fetch(`/api/admin/community/posts/${postId}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo borrar", "Couldn't delete"));
    showToast("success", t("Publicación borrada", "Post deleted"));
    router.push("/admin/comunidad");
    router.refresh();
  }

  return (
    <>
      <span className="ml-auto flex gap-sp-3 font-semibold">
        {canEdit && (
          <button type="button" onClick={() => setEditing(true)} className="text-coral hover:underline">
            {t("Editar", "Edit")}
          </button>
        )}
        <button type="button" onClick={() => setConfirming(true)} className="text-ink/45 hover:text-red-600">
          {t("Borrar", "Delete")}
        </button>
      </span>
      {editing && (
        <div className="basis-full border-t border-line pt-sp-3">
          <NewPostForm editing={{ id: postId, values }} onDone={() => setEditing(false)} />
        </div>
      )}
      {confirming && (
        <ConfirmDialog
          title={t("Borrar publicación", "Delete post")}
          description={t("Se borra para todos, con sus respuestas. No se puede deshacer.", "It's deleted for everyone, with its replies. This can't be undone.")}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
