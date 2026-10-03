"use client";

import { useState } from "react";

/** "Copiar mi enlace" → "¡Copiado!" por 1.5s. Copia la dirección de esta página sin parámetros. */
export default function CopyLinkButton({ label, done }: { label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const url = window.location.origin + window.location.pathname;
    await navigator.clipboard?.writeText(url).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="flex items-center gap-[5px] px-2 py-1 text-[11px] font-semibold text-cobalt/60 transition hover:text-cobalt sm:text-[11.5px]"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
        <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
      </svg>
      <span>{copied ? done : label}</span>
    </button>
  );
}
