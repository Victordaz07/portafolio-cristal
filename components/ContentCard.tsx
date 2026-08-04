"use client";

import { useState } from "react";
import type { Platform, ContentType } from "@/lib/embeds";
import { TikTokIcon, InstagramIcon, FacebookIcon, CameraIcon } from "@/components/icons";
import EmbedLightbox from "./EmbedLightbox";

const PLATFORM_ICONS: Record<Exclude<Platform, "ugc">, (props: { className?: string }) => JSX.Element> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
};

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
}: ContentCardProps) {
  const [open, setOpen] = useState(false);
  const stat = [statPrimary, statSecondary, platform === "ugc" ? brandName : null]
    .filter(Boolean)
    .join(" · ");
  const PlatformIcon = platform !== "ugc" ? PLATFORM_ICONS[platform] : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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

        <span className="absolute right-sp-3 top-sp-3 z-10 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm text-ink">
          {platform === "ugc" ? (
            brandLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brandLogoUrl} alt={brandName ?? ""} className="h-full w-full object-contain p-1.5" />
            ) : (
              <CameraIcon className="h-4 w-4" />
            )
          ) : (
            PlatformIcon && <PlatformIcon className="h-4 w-4" />
          )}
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
