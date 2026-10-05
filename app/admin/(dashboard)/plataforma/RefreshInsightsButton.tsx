"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { primaryButtonClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";

export default function RefreshInsightsButton({ aiReady }: { aiReady: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    const response = await fetch("/api/admin/platform/insights", { method: "POST" });
    setBusy(false);
    const body = (await response.json().catch(() => ({}))) as { error?: string; updated?: string[]; participants?: number };
    if (!response.ok) return showToast("error", body.error ?? t("No se pudo recalcular", "Couldn't recalculate"));
    showToast(
      "success",
      body.updated?.length
        ? t(`Listo: ${body.updated.length} grupo(s) actualizados`, `Done: ${body.updated.length} group(s) updated`)
        : t("Todavía no hay datos suficientes para aprender", "There isn't enough data to learn from yet")
    );
    router.refresh();
  }

  return (
    <button type="button" onClick={refresh} disabled={busy} className={primaryButtonClass} title={aiReady ? "" : t("Sin ANTHROPIC_API_KEY se calculan las cifras, sin el análisis de Claude", "Without ANTHROPIC_API_KEY the numbers are calculated without Claude's analysis")}>
      {busy ? t("Analizando con Claude…", "Analyzing with Claude…") : t("Analizar ahora", "Analyze now")}
    </button>
  );
}
