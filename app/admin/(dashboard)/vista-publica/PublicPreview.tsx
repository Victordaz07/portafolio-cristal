"use client";

import { useEffect, useState } from "react";
import { LOCALE_COOKIE } from "@/lib/i18n";

const DEVICES = [
  { id: "desktop", label: "Escritorio", width: "100%" },
  { id: "mobile", label: "Celular", width: "390px" },
] as const;

/** El sitio público dentro del panel, tal cual lo ve un visitante. */
export default function PublicPreview({ src }: { src: string }) {
  const [device, setDevice] = useState<(typeof DEVICES)[number]["id"]>("desktop");
  const [lang, setLang] = useState<"es" | "en">("es");
  const [reloadKey, setReloadKey] = useState(0);
  const width = DEVICES.find((d) => d.id === device)!.width;

  useEffect(() => {
    if (document.cookie.split("; ").includes(`${LOCALE_COOKIE}=en`)) setLang("en");
  }, []);

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="flex flex-wrap items-center justify-between gap-sp-3 rounded-[16px] bg-ink px-sp-4 py-3.5 text-cream">
        <p className="text-xs">Así es exactamente como lo ve un visitante de tu portafolio público.</p>
        <a href="/" target="_blank" rel="noreferrer" className="text-xs font-semibold text-lime hover:underline">
          Abrir sitio en vivo ↗
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-sp-2">
        {DEVICES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDevice(d.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
              device === d.id ? "bg-ink text-cream" : "border border-line bg-white text-ink/70 hover:border-coral"
            }`}
          >
            {d.label}
          </button>
        ))}
        <span className="mx-sp-2 h-4 w-px bg-line" />
        {(["es", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              // El idioma del sitio vive en una cookie; se cambia y se recarga la vista.
              document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000`;
              setLang(l);
              setReloadKey((k) => k + 1);
            }}
            className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase ${
              lang === l ? "bg-coral text-white" : "border border-line bg-white text-ink/70 hover:border-coral"
            }`}
          >
            {l}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="ml-auto text-xs font-semibold text-coral hover:underline"
        >
          ↻ Recargar
        </button>
      </div>

      <div className="flex justify-center rounded-[18px] border border-line bg-ink/5 p-sp-3">
        <iframe
          key={reloadKey}
          src={src}
          title="Vista pública del portafolio"
          style={{ width }}
          className="h-[78vh] max-w-full rounded-[12px] border border-line bg-white shadow-sm transition-all"
        />
      </div>
    </div>
  );
}
