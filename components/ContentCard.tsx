"use client";

import { useState } from "react";
import type { Platform, ContentType } from "@/lib/embeds";
import { platformLabel } from "@/lib/embeds";
import EmbedLightbox from "./EmbedLightbox";

export interface ContentCardProps {
  type: ContentType;
  platform: Platform;
  postUrl: string;
  caption: string;
  category: string;
  statPrimary?: string | null;
  statSecondary?: string | null;
}

export default function ContentCard({
  type,
  platform,
  postUrl,
  caption,
  category,
  statPrimary,
  statSecondary,
}: ContentCardProps) {
  const [open, setOpen] = useState(false);
  const stat = [statPrimary, statSecondary].filter(Boolean).join(" · ");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`viewfinder group relative w-full overflow-hidden rounded-lg text-left bg-gradient-to-br from-cobalt to-cobalt-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral ${
          type === "video" ? "aspect-[9/16]" : "aspect-[4/5]"
        }`}
      >
        <span className="absolute left-sp-3 top-sp-3 z-10 rounded-sm bg-lime px-sp-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink">
          {category}
        </span>

        <span className="absolute right-sp-3 top-sp-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 font-mono text-[10px] font-bold text-ink">
          {platformLabel(platform)}
        </span>

        <span className="absolute inset-0 flex items-center justify-center">
          {type === "video" ? (
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 transition group-hover:scale-105">
              <span
                className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white/90"
                aria-hidden
              />
            </span>
          ) : (
            <span className="h-14 w-14 rounded-md border-2 border-white/80 transition group-hover:scale-105" />
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
