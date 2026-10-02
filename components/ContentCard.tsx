"use client";

import { useState } from "react";
import type { Platform, ContentType } from "@/lib/embeds";
import { CameraIcon } from "@/components/icons";
import { t, type Locale } from "@/lib/i18n";
import { hasMetrics, metricTiles, type CardMetrics } from "@/lib/metrics";
import EmbedLightbox from "./EmbedLightbox";

export interface ContentCardProps {
  type: ContentType;
  platform: Platform;
  postUrl: string;
  videoUrl?: string | null;
  photoUrl?: string | null;
  caption: string;
  category: string;
  statPrimary?: string | null;
  statSecondary?: string | null;
  thumbnailUrl?: string | null;
  brandName?: string | null;
  brandLogoUrl?: string | null;
  /** null si la creadora decidió no mostrar métricas en esta pieza. */
  metrics?: CardMetrics | null;
  topComment?: string | null;
  topCommentAuthor?: string | null;
  /** Usuario de la red (ej. "@crislia.24") y nombre de la creadora, para la cabecera estilo red social. */
  handle?: string | null;
  displayName?: string | null;
}

function Avatar({ platform, initial }: { platform: Platform; initial: string }) {
  if (platform === "instagram") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral via-lime to-moss p-[2px]">
        <span className="flex h-full w-full items-center justify-center rounded-full bg-white font-bodoni text-[11px] font-bold italic text-ink">
          {initial}
        </span>
      </span>
    );
  }
  const color = platform === "tiktok" ? "bg-cream text-ink" : platform === "facebook" ? "bg-moss text-white" : "bg-cobalt text-white";
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bodoni text-[11px] font-bold italic ${color}`}>
      {initial}
    </span>
  );
}

export default function ContentCard({
  type,
  platform,
  postUrl,
  videoUrl,
  photoUrl,
  caption,
  category,
  statPrimary,
  statSecondary,
  thumbnailUrl,
  brandName,
  brandLogoUrl,
  metrics,
  topComment,
  topCommentAuthor,
  handle,
  displayName,
  locale = "es",
}: ContentCardProps & { locale?: Locale }) {
  const [open, setOpen] = useState(false);
  const copy = t(locale).feed;
  const name = displayName || "UGC";
  const user = handle ? `@${handle.replace(/^@/, "")}` : name;
  const headerTitle = platform === "facebook" ? name : platform === "ugc" ? copy.portafolio : user;
  const headerSub = platform === "facebook" ? `${category} · ${copy.publico}` : category;
  const dark = platform === "tiktok";
  const showTiles = metrics && hasMetrics(metrics);
  const legacyStat = [statPrimary, statSecondary].filter(Boolean).join(" · ");

  return (
    <>
      <article className="flex flex-col overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_1px_2px_rgba(36,18,39,0.04)]">
        <header className={`flex items-center gap-sp-2 px-sp-3 py-2.5 ${dark ? "bg-ink" : ""}`}>
          <Avatar platform={platform} initial={name.charAt(0).toUpperCase()} />
          <div className="min-w-0">
            <p className={`truncate text-[12px] font-bold ${dark ? "text-cream" : "text-ink"}`}>{headerTitle}</p>
            <p className={`truncate text-[10px] ${dark ? "text-cream/55" : "text-ink/55"}`}>{headerSub}</p>
          </div>
          {platform === "ugc" && brandLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandLogoUrl} alt={brandName ?? ""} className="ml-auto h-7 w-7 rounded-full border border-line object-contain p-1" />
          ) : platform === "ugc" ? (
            <CameraIcon className="ml-auto h-4 w-4 text-ink/50" />
          ) : (
            <span aria-hidden className={`ml-auto text-sm ${dark ? "text-cream/55" : "text-ink/45"}`}>
              ⋯
            </span>
          )}
        </header>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={caption}
          className={`group relative w-full overflow-hidden bg-gradient-to-br from-cobalt to-cobalt-ink text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral ${
            type === "video" ? "aspect-[9/16]" : "aspect-[4/5]"
          }`}
        >
          {thumbnailUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-ink/15" aria-hidden="true" />
            </>
          )}
          <span className="absolute left-sp-3 top-sp-3 z-10 max-w-[85%] truncate rounded-sm bg-lime px-sp-2 py-1 font-mono text-[9px] uppercase tracking-widest text-ink">
            {category}
          </span>
          <span className="absolute inset-0 z-10 flex items-center justify-center">
            {type === "video" ? (
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-ink/20 backdrop-blur-sm transition group-hover:scale-105">
                <span
                  className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white/90"
                  aria-hidden
                />
              </span>
            ) : (
              <span className="h-14 w-14 rounded-md border-2 border-white/80 bg-ink/20 backdrop-blur-sm transition group-hover:scale-105" />
            )}
          </span>
        </button>

        {platform === "instagram" && (
          <div className="flex items-center gap-sp-3 px-sp-3 pt-2.5" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink">
              <path d="M12 21s-7.5-4.6-10-9.3C.3 8.6 2 5 5.6 5 8 5 9.6 6.4 12 9c2.4-2.6 4-4 6.4-4C22 5 23.7 8.6 22 11.7 19.5 16.4 12 21 12 21z" />
            </svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink">
              <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z" />
            </svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="ml-auto text-ink">
              <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
            </svg>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-sp-2 p-sp-3">
          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">{caption}</p>
          {brandName && (
            <p className="text-[11px] text-ink/60">
              {copy.enColaboracion} <strong className="text-ink">{brandName}</strong>
            </p>
          )}
          {showTiles ? (
            <div className="grid grid-cols-4 gap-1">
              {metricTiles(metrics, {
                views: copy.vistas,
                likes: copy.likes,
                comments: copy.comentarios,
                engagement: copy.engagement,
              }).map((tile) => (
                <div key={tile.key} className="rounded-[8px] bg-cream px-1.5 py-1">
                  <p className={`font-mono text-[12px] font-bold ${tile.highlight ? "text-coral" : "text-ink"}`}>{tile.value}</p>
                  <p className="text-[8px] uppercase text-ink/55">{tile.label}</p>
                </div>
              ))}
            </div>
          ) : (
            legacyStat && <p className="font-mono text-[11px] uppercase tracking-wide text-ink/55">{legacyStat}</p>
          )}
          {topComment && (
            <div className="mt-auto rounded-[10px] bg-ink px-2.5 py-sp-2">
              <p className="font-mono text-[9px] uppercase tracking-wide text-lime">{copy.loQueDicen}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-cream">
                “{topComment}”{topCommentAuthor && <span className="text-cream/60"> — {topCommentAuthor}</span>}
              </p>
            </div>
          )}
        </div>
      </article>

      {open && (
        <EmbedLightbox
          platform={platform}
          url={postUrl}
          videoUrl={videoUrl}
          photoUrl={photoUrl}
          type={type}
          caption={caption}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
