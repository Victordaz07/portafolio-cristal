"use client";

/** Botón «Descargar PDF / Imprimir» del reporte (la ventana de impresión permite «Guardar como PDF»). */
export default function ReportPrintBar({ lang }: { lang: "es" | "en" }) {
  const en = lang === "en";
  return (
    <div className="mx-auto mb-sp-4 flex max-w-3xl flex-wrap items-center justify-between gap-sp-2 print:hidden">
      <p className="text-xs text-ink/50">{en ? "In the print dialog, choose “Save as PDF”." : "En la ventana de impresión elige «Guardar como PDF»."}</p>
      <button type="button" onClick={() => window.print()} className="rounded-full border border-line bg-white px-sp-4 py-1.5 text-xs font-semibold text-ink hover:border-coral">
        {en ? "Download PDF / Print" : "Descargar PDF / Imprimir"}
      </button>
    </div>
  );
}
