"use client";

import { useState } from "react";
import { parseEmbedUrl, platformLabel, type Platform, type ContentType } from "@/lib/embeds";
import PlatformEmbed from "@/components/embeds/PlatformEmbed";
import { inputClass, secondaryButtonClass } from "@/lib/admin-ui";

export default function EmbedUrlInput({
  url,
  onUrlChange,
  platform,
  type,
}: {
  url: string;
  onUrlChange: (url: string, detected: { platform: Platform | null; inferredType: ContentType | null }) => void;
  platform: Platform | null;
  type: ContentType | null;
}) {
  const [showPreview, setShowPreview] = useState(false);

  function handleChange(value: string) {
    setShowPreview(false);
    onUrlChange(value, parseEmbedUrl(value));
  }

  return (
    <div className="flex flex-col gap-sp-2">
      <span className="text-sm font-medium text-ink">URL del post</span>
      <div className="flex flex-wrap items-center gap-sp-3">
        <input
          required
          type="url"
          value={url}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="https://www.tiktok.com/@usuario/video/..."
          className={`${inputClass} flex-1 min-w-[240px]`}
        />
        {platform && (
          <span className="rounded-full bg-lime px-sp-3 py-1 font-mono text-[10px] uppercase text-ink">
            {platformLabel(platform)}
          </span>
        )}
        <button
          type="button"
          disabled={!platform || !type || !url}
          onClick={() => setShowPreview(true)}
          className={secondaryButtonClass}
        >
          Cargar preview
        </button>
      </div>

      {!platform && url && (
        <p className="text-xs text-red-600">
          No reconozco la plataforma de esa URL (debe ser de TikTok, Instagram o Facebook).
        </p>
      )}

      {showPreview && platform && type && (
        <div className="rounded-md border border-line bg-cream p-sp-4">
          <PlatformEmbed platform={platform} url={url} type={type} />
        </div>
      )}
    </div>
  );
}
