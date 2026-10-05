"use client";

import { useT } from "@/components/admin/AdminLang";

export default function ConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 px-sp-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-md bg-white p-sp-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="font-bodoni italic font-bold text-lg text-ink">{title}</h3>
        <p className="mt-sp-2 text-sm text-ink/70">{description}</p>
        <div className="mt-sp-5 flex justify-end gap-sp-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border border-line px-sp-4 py-sp-2 text-sm font-medium text-ink hover:bg-cream"
          >
            {t("Cancelar", "Cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-sm bg-red-600 px-sp-4 py-sp-2 text-sm font-medium text-white hover:opacity-90"
          >
            {confirmLabel ?? t("Eliminar", "Delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
