"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useT } from "@/components/admin/AdminLang";

// Píxel de Meta para medir las campañas de la página de venta (solo si NEXT_PUBLIC_META_PIXEL_ID está
// configurado). Es un rastreador de publicidad, así que no carga hasta que la persona lo acepta:
// - sin respuesta: se muestra el aviso y el píxel NO carga;
// - "Aceptar": carga el píxel y se recuerda la respuesta en este navegador;
// - "No, gracias" o el navegador manda Global Privacy Control: no carga nunca.

const STORAGE_KEY = "fc-ads-consent";
type Consent = "loading" | "ask" | "granted" | "denied";

function stored(): "granted" | "denied" | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export default function MetaPixel() {
  const { t } = useT();
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const enabled = Boolean(id && /^\d+$/.test(id));
  const [consent, setConsent] = useState<Consent>("loading");

  useEffect(() => {
    if (!enabled) return;
    // Global Privacy Control: la persona ya dijo en su navegador que no quiere que se compartan sus datos.
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    setConsent(gpc ? "denied" : stored() ?? "ask");
  }, [enabled]);

  function answer(value: "granted" | "denied") {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Sin almacenamiento (modo privado): la respuesta vale solo para esta visita.
    }
    setConsent(value);
  }

  if (!enabled) return null;

  if (consent === "granted") {
    return (
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`}
      </Script>
    );
  }

  if (consent !== "ask") return null;

  return (
    <div
      role="dialog"
      aria-label={t("Aviso de cookies", "Cookie notice")}
      className="fixed inset-x-sp-3 bottom-sp-3 z-50 mx-auto max-w-xl rounded-[18px] border border-[#251023]/15 bg-white p-sp-4 shadow-lg"
    >
      <p className="text-sm leading-relaxed text-[#251023]/80">
        {t(
          "¿Nos dejas usar el píxel de Meta para medir si nuestros anuncios funcionan? Comparte tu visita a esta página con Meta. Si dices que no, todo funciona igual.",
          "May we use the Meta pixel to measure whether our ads work? It shares your visit to this page with Meta. If you say no, everything works the same."
        )}{" "}
        <Link href="/privacidad" className="text-[#7F207B] underline">
          {t("Privacidad", "Privacy")}
        </Link>
      </p>
      <div className="mt-sp-3 flex flex-wrap gap-sp-2">
        <button type="button" onClick={() => answer("denied")} className="rounded-full border border-[#251023] px-sp-4 py-sp-2 text-sm font-semibold text-[#251023] hover:opacity-80">
          {t("No, gracias", "No, thanks")}
        </button>
        <button type="button" onClick={() => answer("granted")} className="rounded-full border border-[#251023] bg-[#251023] px-sp-4 py-sp-2 text-sm font-semibold text-[#FBF7F5] hover:opacity-90">
          {t("Aceptar", "Accept")}
        </button>
      </div>
    </div>
  );
}
