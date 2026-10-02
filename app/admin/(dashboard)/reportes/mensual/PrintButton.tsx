"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-coral px-sp-5 py-2.5 text-sm font-bold text-white transition hover:bg-moss print:hidden"
    >
      Imprimir / Guardar PDF
    </button>
  );
}
