"use client";

import { useState } from "react";
import type { Platform, ContentType } from "@/lib/embeds";
import { formatCompact } from "@/lib/metrics";
import { t, type Locale } from "@/lib/i18n";
import EmbedLightbox from "./EmbedLightbox";

export interface CollaborationPiece {
  type: ContentType;
  platform: Platform;
  postUrl: string;
  videoUrl: string | null;
  photoUrl: string | null;
  thumbnailUrl: string | null;
  caption: string;
  category: string;
  views: number | null;
}

export interface CollaborationBrand {
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  pieces: CollaborationPiece[];
}

/** Sección "Colaboraciones": por marca, su logo y hasta 3 piezas destacadas con su alcance. */
export default function CollaborationsSection({ brands, locale }: { brands: CollaborationBrand[]; locale: Locale }) {
  const copy = t(locale).colaboraciones;
  const [open, setOpen] = useState<CollaborationPiece | null>(null);

  return (
    <>
      <h2 className="mb-sp-2 font-bodoni text-[clamp(1.8rem,3.4vw,2.6rem)] font-bold uppercase italic text-ink">{copy.heading}</h2>
      <p className="mb-sp-6 text-ink/65">{copy.intro}</p>
      <div className="flex flex-col gap-sp-7">
        {brands.map((brand) => {
          const logo = (
            <div className="flex h-[96px] w-[96px] items-center justify-center rounded-[18px] border border-line bg-white p-sp-3 sm:h-[110px] sm:w-[110px]">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="font-bodoni text-3xl font-bold italic text-ink/40">{brand.name.charAt(0)}</span>
              )}
            </div>
          );
          return (
            <div key={brand.name} className="grid items-center gap-sp-4 sm:grid-cols-[150px_1fr] sm:gap-sp-5">
              <div className="flex items-center gap-sp-3 sm:flex-col sm:text-center">
                {brand.websiteUrl ? (
                  <a href={brand.websiteUrl} target="_blank" rel="noreferrer">
                    {logo}
                  </a>
                ) : (
                  logo
                )}
                <p className="font-fraunces text-[15px] font-semibold text-ink">{brand.name}</p>
              </div>
              <div className="grid max-w-[560px] grid-cols-3 items-end gap-sp-3">
                {brand.pieces.map((piece, index) => (
                  <button
                    key={`${piece.postUrl}-${index}`}
                    type="button"
                    onClick={() => setOpen(piece)}
                    className="group flex flex-col gap-1.5 text-left"
                  >
                    <span
                      className={`relative block w-full overflow-hidden rounded-[14px] bg-gradient-to-br from-cobalt to-cobalt-ink ${
                        piece.type === "video" ? "aspect-[9/16]" : "aspect-[4/5]"
                      }`}
                    >
                      {piece.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={piece.thumbnailUrl}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                        />
                      )}
                      <span className="absolute left-1.5 top-1.5 max-w-[88%] truncate rounded-[4px] bg-lime px-1.5 py-0.5 font-mono text-[8px] uppercase text-ink">
                        {piece.category}
                      </span>
                    </span>
                    <span className="text-[11px] font-semibold text-coral">
                      {piece.views != null ? `${formatCompact(piece.views)} ${copy.vistas}` : piece.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {open && (
        <EmbedLightbox
          platform={open.platform}
          url={open.postUrl}
          videoUrl={open.videoUrl}
          photoUrl={open.photoUrl}
          type={open.type}
          caption={open.caption}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
