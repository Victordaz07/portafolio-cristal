"use client";

import { useState } from "react";

const COPY = {
  es: {
    print: "Descargar PDF / Imprimir",
    paid: "Ya pagamos",
    confirm: "¿Confirmas que ya hicieron el pago? Le avisaremos para que lo verifique.",
    thanks: "¡Gracias! Le avisamos para que confirme el pago.",
    already: "Ya avisaron del pago. ¡Gracias!",
    error: "No se pudo avisar. Intenta de nuevo en un momento.",
    tip: "En la ventana de impresión elige «Guardar como PDF».",
  },
  en: {
    print: "Download PDF / Print",
    paid: "We paid",
    confirm: "Do you confirm the payment was made? We'll let them know so they can check it.",
    thanks: "Thank you! We let them know so they can confirm the payment.",
    already: "You already let them know about the payment. Thank you!",
    error: "Couldn't notify them. Please try again in a moment.",
    tip: "In the print dialog, choose “Save as PDF”.",
  },
};

/** Botones de la página pública: descargar/imprimir y "Ya pagamos". */
export default function InvoicePublicActions({ token, lang, canClaim, claimed }: { token: string; lang: "es" | "en"; canClaim: boolean; claimed: boolean }) {
  const c = COPY[lang];
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">(claimed ? "done" : "idle");

  async function claim() {
    if (!window.confirm(c.confirm)) return;
    setState("busy");
    const response = await fetch(`/api/invoice/${encodeURIComponent(token)}/paid`, { method: "POST" }).catch(() => null);
    setState(response?.ok ? "done" : "error");
  }

  return (
    <div className="mx-auto mb-sp-4 flex w-full max-w-3xl flex-col gap-sp-2 print:hidden">
      <div className="flex flex-wrap items-center gap-sp-2">
        <button type="button" onClick={() => window.print()} className="rounded-full bg-ink px-sp-5 py-sp-2 text-sm font-semibold text-cream hover:bg-coral">
          {c.print}
        </button>
        {canClaim && state !== "done" && (
          <button
            type="button"
            disabled={state === "busy"}
            onClick={claim}
            className="rounded-full border border-line bg-white px-sp-5 py-sp-2 text-sm font-semibold text-ink hover:border-coral disabled:opacity-50"
          >
            ✓ {c.paid}
          </button>
        )}
      </div>
      <p className="text-xs text-ink/50">{c.tip}</p>
      {state === "done" && canClaim && <p className="text-sm font-semibold text-moss">{claimed ? c.already : c.thanks}</p>}
      {state === "error" && <p className="text-sm text-coral">{c.error}</p>}
    </div>
  );
}
