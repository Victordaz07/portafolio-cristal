"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { secondaryButtonClass } from "@/lib/admin-ui";

export default function CustomerTicketActions({ id, closed }: { id: string; closed: boolean }) {
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
    if (!response.ok) return showToast("error", "No se pudo actualizar");
    showToast("success", closed ? "Ticket reabierto" : "Ticket cerrado. ¡Gracias!");
    router.refresh();
  }

  return (
    <button type="button" className={secondaryButtonClass} onClick={toggle} disabled={busy}>
      {closed ? "Reabrir ticket" : "✓ Ya está resuelto, cerrar ticket"}
    </button>
  );
}
