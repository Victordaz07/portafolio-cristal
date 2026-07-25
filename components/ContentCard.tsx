"use client";

import { useState } from "react";
import type { Platform, ContentType } from "@/lib/embeds";
import { TikTokIcon, InstagramIcon, FacebookIcon } from "@/components/icons";
import EmbedLightbox from "./EmbedLightbox";

const PLATFORM_ICONS: Record<Platform, (props: { className?: string }) => JSX.Element> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
};

export interface ContentCardProps {
  type: ContentType;
  platform: Platform;
  postUrl: string;
  caption: string;
  category: string;
  statPrimary?: string | null;
  statSecondary?: string | null;
  thumbnailUrl?: string | null;
}

export default function ContentCard({
  type,
  platform,
  postUrl,
  caption,
  category,
  statPrimary,
  statSecondary,
  thumbnailUrl,
}: ContentCardProps) {
  const [open, setOpen] = useState(false);
  const stat = [statPrimary, statSecondary].filter(Boolean).join(" · ");
  const PlatformIcon = PLATFORM_ICONS[platform];

  function handleClick() {
    // En TikTok, la reproducción embebida no funciona en móvil/tablet: su propio
    // script bloquea el video y obliga a abrir la app/sitio. Abrimos directo para
    // no mostrar un reproductor que parece funcionar pero no hace nada.
    const isTouchViewport = typeof window !== "undefined" && window.innerWidth < 768;
    if (platform === "tiktok" && isTouchViewport) {
      window.open(postUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`group relative w-full overflow-hidden rounded-[28px] text-left bg-gradient-to-br from-cobalt to-cobalt-ink ring-1 ring-ink/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral ${
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

        <span className="absolute left-sp-3 top-sp-3 z-10 rounded-sm bg-lime px-sp-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink">
          {category}
        </span>

        <span className="absolute right-sp-3 top-sp-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm text-ink">
          <PlatformIcon className="h-4 w-4" />
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

        <span className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent px-sp-4 pb-sp-4 pt-sp-8">
          <span className="block text-sm text-white line-clamp-2">{caption}</span>
          {stat && (
            <span className="mt-1 block font-mono text-xs uppercase tracking-wide text-white/80">
              {stat}
            </span>
          )}
        </span>
      </button>

      {open && (
        <EmbedLightbox
          platform={platform}
          url={postUrl}
          type={type}
          caption={caption}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
