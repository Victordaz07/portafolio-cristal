"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { secondaryButtonClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";

export default function CustomerTicketActions({ id, closed }: { id: string; closed: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const response = await fetch(`/api/admin/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: closed ? "reopen" : "close" }),
    });
    setBusy(false);
    if (!response.ok) return showToast("error", t("No se pudo actualizar", "Couldn't update"));
    showToast("success", closed ? t("Ticket reabierto", "Ticket reopened") : t("Ticket cerrado. ¡Gracias!", "Ticket closed. Thank you!"));
    router.refresh();
  }

  return (
    <button type="button" className={secondaryButtonClass} onClick={toggle} disabled={busy}>
      {closed ? t("Reabrir ticket", "Reopen ticket") : t("✓ Ya está resuelto, cerrar ticket", "✓ It's solved, close ticket")}
    </button>
  );
}
