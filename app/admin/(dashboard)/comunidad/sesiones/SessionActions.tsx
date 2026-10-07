"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

/** Reservar o cancelar el lugar, entrar a la videollamada y añadir al calendario. */
export default function SessionActions({ id, phase, reserved, allowed, full, joinUrl }: { id: string; phase: string; reserved: boolean; allowed: boolean; full: boolean; joinUrl: string | null }) {
  const { t } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function call(method: "POST" | "DELETE") {
    setBusy(true);
    const response = await fetch(`/api/admin/community/sessions/${id}/rsvp`, { method });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", method === "POST" ? t("¡Lugar reservado!", "Spot booked!") : t("Reserva cancelada", "Booking canceled"));
    router.refresh();
  }

  if (phase === "canceled" || phase === "ended") return null;
  return (
    <div className="mt-sp-3 flex flex-wrap items-center gap-sp-3">
      {reserved ? (
        <>
          {joinUrl && (
            <a href={joinUrl} target="_blank" rel="noopener noreferrer" className={primaryButtonClass}>{phase === "live" ? t("Entrar ahora", "Join now") : t("Ver enlace de la sesión", "See the session link")}</a>
          )}
          <a href={`/api/admin/community/sessions/${id}/ics`} className={`${secondaryButtonClass} !px-sp-3 !py-1.5 text-xs`}>{t("Añadir al calendario", "Add to calendar")}</a>
          <button type="button" onClick={() => window.confirm(t("¿Cancelar tu lugar?", "Cancel your spot?")) && call("DELETE")} disabled={busy} className="text-xs text-red-600/70 hover:text-red-600">{t("Cancelar mi lugar", "Cancel my spot")}</button>
        </>
      ) : !allowed ? (
        <span className="text-xs text-ink/50">{t("Exclusiva del plan Crew", "Exclusive to the Crew plan")}</span>
      ) : full ? (
        <span className="text-xs text-ink/50">{t("Sin lugares disponibles", "No spots left")}</span>
      ) : (
        <button type="button" onClick={() => call("POST")} disabled={busy} className={primaryButtonClass}>{t("Reservar mi lugar", "Book my spot")}</button>
      )}
    </div>
  );
}
