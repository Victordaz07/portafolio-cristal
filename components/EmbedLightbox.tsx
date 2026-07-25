"use client";

import { useEffect } from "react";
import type { Platform, ContentType } from "@/lib/embeds";
import PlatformEmbed from "./embeds/PlatformEmbed";

export default function EmbedLightbox({
  platform,
  url,
  videoUrl,
  type,
  caption,
  onClose,
}: {
  platform: Platform;
  url: string;
  videoUrl?: string | null;
  type: ContentType;
  caption: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={caption}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-sp-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white p-sp-5"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-sp-4 top-sp-4 flex h-8 w-8 items-center justify-center rounded-full bg-cream text-ink hover:bg-line"
        >
          ×
        </button>
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-4 pr-sp-8">
          {caption}
        </p>
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            muted
            playsInline
            className="mx-auto max-h-[75vh] w-full rounded-md"
          />
        ) : (
          <PlatformEmbed platform={platform} url={url} type={type} />
        )}
      </div>
    </div>
  );
}
