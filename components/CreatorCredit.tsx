"use client";

import { useEffect, useRef, useState } from "react";
import { AtomIcon } from "@/components/icons";
import { creatorInfo } from "@/lib/creator-info";
import type { Locale } from "@/lib/i18n";

const COPY = {
  es: {
    ariaLabel: "Sobre este sitio",
    close: "Cerrar",
    eyebrow: "Detrás de la experiencia",
    heading: "Creado con intención, pensado para sentirse personal.",
    creatorLine: `Diseñado y desarrollado por ${creatorInfo.name} — Diseñador y creador de experiencias web.`,
    description:
      "Este sitio es una experiencia 100% personalizada, hecha a la medida de Cristal. Diseño portafolios así para creadoras y marcas personales — el tuyo podría ser el siguiente.",
    availability: "Disponible para proyectos personalizados",
    primaryLabel: "Empezar un proyecto",
    secondaryLabel: "Ver mi portafolio",
    footerLine: "Diseñado con propósito. Construido con React.",
  },
  en: {
    ariaLabel: "About this website",
    close: "Close",
    eyebrow: "Behind the experience",
    heading: "Built with intention, made to feel personal.",
    creatorLine: `Designed and developed by ${creatorInfo.name} — ${creatorInfo.role}.`,
    description:
      "This site is a fully custom experience, built around Crislia's brand and content. I design portfolios like this for creators and personal brands — yours could be next.",
    availability: creatorInfo.availability,
    primaryLabel: "Start a project",
    secondaryLabel: "View my portfolio",
    footerLine: "Designed with purpose. Built with React.",
  },
} as const;

export default function CreatorCredit({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setVisible(true));

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function close() {
    setVisible(false);
    setOpen(false);
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={copy.ariaLabel}
        className="group flex h-11 w-11 items-center justify-center rounded-full border border-line bg-cream text-ink/70 opacity-[0.65] shadow-sm transition hover:-translate-y-0.5 hover:text-coral hover:opacity-100 hover:shadow-md focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
      >
        <AtomIcon className="h-5 w-5 transition-transform duration-500 group-hover:rotate-90" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/30 transition-opacity sm:bg-transparent"
            onClick={close}
          />
          <div
            ref={cardRef}
            role="dialog"
            aria-label={copy.ariaLabel}
            className={`fixed inset-x-0 bottom-0 z-50 rounded-t-[24px] border-t border-lime/40 bg-cream p-sp-6 shadow-2xl transition-all duration-300 ease-out sm:absolute sm:inset-x-auto sm:bottom-full sm:right-0 sm:mb-sp-3 sm:w-[360px] sm:rounded-[24px] sm:border sm:border-lime/40 sm:p-sp-6 ${
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0 sm:translate-y-2"
            }`}
          >
            <button
              type="button"
              onClick={close}
              aria-label={copy.close}
              className="absolute right-sp-4 top-sp-4 flex h-7 w-7 items-center justify-center rounded-full text-ink/40 hover:text-ink"
            >
              ×
            </button>

            <div className="flex items-center gap-sp-2">
              <AtomIcon className="h-4 w-4 text-lime" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-moss">
                {copy.eyebrow}
              </p>
            </div>

            <p className="mt-sp-3 font-fraunces italic text-lg leading-snug text-ink">
              {copy.heading}
            </p>
            <p className="mt-sp-2 text-xs text-ink/70">{copy.creatorLine}</p>
            <p className="mt-sp-3 text-xs leading-relaxed text-ink/70">{copy.description}</p>

            <span className="mt-sp-4 inline-flex items-center gap-1 rounded-full border border-lime/50 bg-lime/15 px-sp-3 py-1 font-mono text-[10px] uppercase tracking-wide text-ink/70">
              {copy.availability}
            </span>

            <div className="mt-sp-4 flex flex-wrap gap-sp-3">
              <a
                href={`mailto:${creatorInfo.email}?subject=Custom%20Portfolio%20Project`}
                className="rounded-full bg-ink px-sp-4 py-sp-2 text-xs font-medium text-cream hover:opacity-90 transition"
              >
                {copy.primaryLabel}
              </a>
              <a
                href={creatorInfo.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-sp-4 py-sp-2 text-xs font-medium text-ink hover:border-coral hover:text-coral transition"
              >
                {copy.secondaryLabel}
              </a>
            </div>

            <p className="mt-sp-4 text-[11px] text-ink/50">
              {creatorInfo.email} · {creatorInfo.portfolioUrl.replace(/^https?:\/\//, "")}
            </p>
            <p className="mt-sp-1 font-mono text-[10px] uppercase tracking-wide text-ink/30">
              {copy.footerLine}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
