"use client";

import { useT } from "@/components/admin/AdminLang";

export default function ReorderButtons({
  onUp,
  onDown,
  disableUp,
  disableDown,
}: {
  onUp: () => void;
  onDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
}) {
  const { t } = useT();
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onUp}
        disabled={disableUp}
        aria-label={t("Mover arriba", "Move up")}
        className="text-ink/60 hover:text-coral disabled:opacity-30"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disableDown}
        aria-label={t("Mover abajo", "Move down")}
        className="text-ink/60 hover:text-coral disabled:opacity-30"
      >
        ▼
      </button>
    </div>
  );
}
