"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

/** Bloquear / desbloquear a alguien en la comunidad. */
export default function BlockButton({ handle, name, blocked }: { handle: string; name: string; blocked: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);

  async function run(block: boolean) {
    setConfirming(false);
    const response = await fetch("/api/admin/community/block", {
      method: block ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", block ? t(`Bloqueaste a ${name}`, `You blocked ${name}`) : t(`Desbloqueaste a ${name}`, `You unblocked ${name}`));
    if (block) router.push("/admin/comunidad");
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => (blocked ? run(false) : setConfirming(true))} className="text-xs text-ink/40 hover:text-red-600">
        {blocked ? t("Desbloquear", "Unblock") : t("Bloquear", "Block")}
      </button>
      {confirming && (
        <ConfirmDialog
          title={t(`¿Bloquear a ${name}?`, `Block ${name}?`)}
          description={t(
            "Dejarán de ver sus publicaciones mutuamente y no podrá responderte. No se le avisa. Puedes desbloquear cuando quieras desde Mi perfil.",
            "You'll stop seeing each other's posts and they won't be able to reply to you. They aren't notified. You can unblock anytime from My profile."
          )}
          confirmLabel={t("Bloquear", "Block")}
          onConfirm={() => run(true)}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
