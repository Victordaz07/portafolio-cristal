"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/admin/AdminLang";

/** Franja fija mientras una agencia (plan Crew) está "entrando a" una cuenta de su cartera. */
export default function AgencyEnterBanner({ creatorName }: { creatorName: string }) {
  const { t } = useT();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function leave() {
    setLeaving(true);
    const response = await fetch("/api/admin/agency/enter", { method: "DELETE" });
    const body = (await response.json().catch(() => ({}))) as { back?: string };
    if (!response.ok) {
      setLeaving(false);
      return;
    }
    router.push(body.back ?? "/admin/agencia");
    router.refresh();
  }

  return (
    <div role="status" className="mb-sp-4 flex flex-wrap items-center justify-between gap-sp-3 rounded-[14px] bg-ink px-sp-4 py-sp-3 text-sm text-cream">
      <p>
        👥 {t("Estás en la cuenta de", "You're in the account of")} <strong>{creatorName}</strong> {t("· Lo que cambies se guarda ahí.", "· What you change is saved there.")}
      </p>
      <button
        type="button"
        onClick={leave}
        disabled={leaving}
        className="rounded-full bg-cream px-sp-4 py-1.5 text-xs font-semibold text-ink hover:bg-white disabled:opacity-60"
      >
        {leaving ? t("Saliendo…", "Leaving…") : t("Volver a tu agencia", "Back to your agency")}
      </button>
    </div>
  );
}
