"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { primaryButtonClass } from "@/lib/admin-ui";

export default function RefreshInsightsButton({ aiReady }: { aiReady: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    const response = await fetch("/api/admin/platform/insights", { method: "POST" });
    setBusy(false);
    const body = (await response.json().catch(() => ({}))) as { error?: string; updated?: string[]; participants?: number };
    if (!response.ok) return showToast("error", body.error ?? "No se pudo recalcular");
    showToast("success", body.updated?.length ? `Listo: ${body.updated.length} grupo(s) actualizados` : "Todavía no hay datos suficientes para aprender");
    router.refresh();
  }

  return (
    <button type="button" onClick={refresh} disabled={busy} className={primaryButtonClass} title={aiReady ? "" : "Sin ANTHROPIC_API_KEY se calculan las cifras, sin el análisis de Claude"}>
      {busy ? "Analizando con Claude…" : "Analizar ahora"}
    </button>
  );
}
