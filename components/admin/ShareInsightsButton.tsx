"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Sumarse o salir de la inteligencia de Foliocrew (resultados anónimos a cambio de comparativas del nicho). */
export default function ShareInsightsButton({ share, label, variant = "primary" }: { share: boolean; label: string; variant?: "primary" | "ghost" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/account/insights", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ share }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const data = await res?.json().catch(() => null);
      setError(data?.error || "No se pudo guardar. Intenta de nuevo.");
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={
          variant === "primary"
            ? "rounded-full bg-ink px-sp-4 py-2 text-sm font-semibold text-cream transition hover:bg-coral disabled:opacity-60"
            : "rounded-full border border-line bg-white px-sp-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-coral hover:text-ink disabled:opacity-60"
        }
      >
        {busy ? "Guardando…" : label}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}
