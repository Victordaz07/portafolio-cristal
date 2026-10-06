"use client";

import { useState } from "react";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";

/** "💡 Me sirvió": se marca y desmarca al momento; el servidor confirma el número. */
export default function HelpfulButton({
  targetType,
  targetId,
  count,
  active,
  disabled = false,
}: {
  targetType: "post" | "reply";
  targetId: string;
  count: number;
  active: boolean;
  disabled?: boolean;
}) {
  const { t } = useT();
  const { showToast } = useToast();
  const [state, setState] = useState({ count, active });
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy || disabled) return;
    setBusy(true);
    const before = state;
    setState({ active: !before.active, count: Math.max(0, before.count + (before.active ? -1 : 1)) });
    const response = await fetch("/api/admin/community/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; active?: boolean; count?: number };
    setBusy(false);
    if (!response.ok) {
      setState(before);
      return showToast("error", data.error ?? t("No se pudo marcar", "Couldn't mark it"));
    }
    setState({ active: Boolean(data.active), count: data.count ?? 0 });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-pressed={state.active}
      title={disabled ? t("No puedes marcar lo tuyo", "You can't mark your own content") : undefined}
      className={`inline-flex items-center gap-1 rounded-full border px-sp-3 py-1 text-xs font-semibold transition ${
        state.active ? "border-lime bg-lime/40 text-moss" : "border-line bg-white text-ink/65 hover:border-coral"
      } disabled:cursor-default disabled:opacity-60`}
    >
      💡 {state.count} {t("me sirvió", "helpful")}
    </button>
  );
}
