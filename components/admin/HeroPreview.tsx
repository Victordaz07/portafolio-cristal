"use client";

import { renderHighlightedText } from "@/lib/highlight";
import { SparkleIcon, ArrowRightIcon } from "@/components/icons";
import { useT } from "./AdminLang";

export default function HeroPreview({
  badgeLabel,
  headlinePlain,
  headlineEmphasis,
  headlineSuffix,
  description,
  photoUrl,
  ctaPrimaryLabel,
  ctaSecondaryLabel,
}: {
  badgeLabel: string;
  headlinePlain: string;
  headlineEmphasis: string;
  headlineSuffix: string;
  description: string;
  photoUrl: string;
  ctaPrimaryLabel: string;
  ctaSecondaryLabel: string;
}) {
  const { t } = useT();
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-cream shadow-[0_1px_2px_rgba(36,18,39,0.04)]">
      <div className="grid grid-cols-2 items-stretch">
        <div className="flex items-center px-sp-4 py-sp-6">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full border border-line px-sp-2 py-1 font-mono text-[8px] uppercase tracking-widest text-ink/80">
              <SparkleIcon className="h-2.5 w-2.5 text-lime" />
              {badgeLabel || "Badge"}
            </span>

            <h3 className="mt-sp-2 font-fraunces text-lg font-semibold leading-tight tracking-[-0.01em] text-ink">
              {headlinePlain || t("Título", "Title")}
              <br />
              <em className="font-fraunces not-italic text-lime">
                {headlineEmphasis || t("énfasis", "emphasis")}
              </em>{" "}
              {headlineSuffix}
            </h3>

            <div className="mt-sp-2 h-px w-16 bg-gradient-to-r from-lime to-transparent" />

            <p className="mt-sp-2 line-clamp-3 font-sans text-[11px] leading-snug text-ink/70">
              {renderHighlightedText(description || t("La descripción aparece aquí…", "The description appears here…"))}
            </p>

            <div className="mt-sp-3 flex flex-wrap gap-sp-2">
              <span className="inline-flex items-center gap-1 rounded-sm bg-cobalt px-sp-2 py-1 text-[9px] font-medium text-cream">
                {ctaPrimaryLabel || "CTA primario"}
                <ArrowRightIcon className="h-2.5 w-2.5" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm border border-cobalt px-sp-2 py-1 text-[9px] font-medium text-cobalt">
                {ctaSecondaryLabel || "CTA secundario"}
              </span>
            </div>
          </div>
        </div>

        <div className="relative min-h-[190px]">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-right"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-cobalt-ink/10 text-center text-[10px] text-ink/40">
              {t("Sin foto", "No photo")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
