"use client";

import { useT } from "@/components/admin/AdminLang";

export default function PrintButton() {
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-coral px-sp-5 py-2.5 text-sm font-bold text-white transition hover:bg-moss print:hidden"
    >
      {t("Imprimir / Guardar PDF", "Print / Save PDF")}
    </button>
  );
}
