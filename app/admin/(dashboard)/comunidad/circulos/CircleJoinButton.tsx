"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

/** Unirse o salir de un círculo. */
export default function CircleJoinButton({ slug, joined }: { slug: string; joined: boolean }) {
  const { t } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    if (joined && !window.confirm(t("¿Salir de este círculo?", "Leave this circle?"))) return;
    setBusy(true);
    const response = await fetch(`/api/admin/community/circles/${slug}/join`, { method: joined ? "DELETE" : "POST" });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    router.refresh();
  }
  return (
    <button type="button" onClick={toggle} disabled={busy} className={joined ? `${secondaryButtonClass} !px-sp-3 !py-1.5 text-xs` : `${primaryButtonClass} !px-sp-4 !py-1.5 text-xs`}>
      {joined ? t("Salir", "Leave") : t("Unirme", "Join")}
    </button>
  );
}
