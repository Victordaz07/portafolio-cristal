"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Franja fija mientras alguien del equipo de Foliocrew está "entrando como" otra cuenta. */
export default function ImpersonationBanner({ creatorName }: { creatorName: string }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function leave() {
    setLeaving(true);
    const response = await fetch("/api/admin/platform/impersonate", { method: "DELETE" });
    const body = (await response.json().catch(() => ({}))) as { back?: string };
    if (!response.ok) {
      setLeaving(false);
      return;
    }
    router.push(body.back ?? "/admin/plataforma");
    router.refresh();
  }

  return (
    <div role="status" className="mb-sp-4 flex flex-wrap items-center justify-between gap-sp-3 rounded-[14px] bg-ink px-sp-4 py-sp-3 text-sm text-cream">
      <p>
        🛟 Estás viendo el panel de <strong>{creatorName}</strong> como soporte. Todo lo que cambies se guarda en su cuenta.
      </p>
      <button
        type="button"
        onClick={leave}
        disabled={leaving}
        className="rounded-full bg-cream px-sp-4 py-1.5 text-xs font-semibold text-ink hover:bg-white disabled:opacity-60"
      >
        {leaving ? "Saliendo…" : "Volver a mi cuenta"}
      </button>
    </div>
  );
}
