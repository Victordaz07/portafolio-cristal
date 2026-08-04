"use client";

import { useState } from "react";
import { parseEmbedUrl, platformLabel, type Platform, type ContentType } from "@/lib/embeds";
import PlatformEmbed from "@/components/embeds/PlatformEmbed";
import { inputClass, secondaryButtonClass } from "@/lib/admin-ui";

function isUnresolvedTikTokShortLink(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./, "");
    if (!(host === "tiktok.com" || host.endsWith(".tiktok.com"))) return false;
    return !/\/video\/\d+/.test(parsed.pathname);
  } catch {
    return false;
  }
}

export default function EmbedUrlInput({
  url,
  onUrlChange,
  onThumbnailResolved,
  platform,
  type,
}: {
  url: string;
  onUrlChange: (url: string, detected: { platform: Platform | null; inferredType: ContentType | null }) => void;
  onThumbnailResolved?: (thumbnailUrl: string | null) => void;
  platform: Platform | null;
  type: ContentType | null;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [fetchingThumbnail, setFetchingThumbnail] = useState(false);

  function handleChange(value: string) {
    setShowPreview(false);
    onUrlChange(value, parseEmbedUrl(value));
  }

  async function handleLoadPreview() {
    let resolvedUrl = url;
    if (isUnresolvedTikTokShortLink(url)) {
      setResolving(true);
      try {
        const response = await fetch(`/api/admin/resolve-url?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        if (response.ok && data.resolvedUrl) {
          resolvedUrl = data.resolvedUrl;
          onUrlChange(data.resolvedUrl, parseEmbedUrl(data.resolvedUrl));
        }
      } finally {
        setResolving(false);
      }
    }
    setShowPreview(true);

    if (onThumbnailResolved && (platform === "instagram" || platform === "facebook")) {
      setFetchingThumbnail(true);
      try {
        const response = await fetch(`/api/admin/resolve-thumbnail?url=${encodeURIComponent(resolvedUrl)}`);
        const data = await response.json();
        onThumbnailResolved(response.ok ? data.thumbnailUrl ?? null : null);
      } catch {
        onThumbnailResolved(null);
      } finally {
        setFetchingThumbnail(false);
      }
    }
  }

  return (
    <div className="flex flex-col gap-sp-2">
      <span className="text-sm font-medium text-ink">URL del post</span>
      <div className="flex flex-wrap items-center gap-sp-3">
        <input
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
          disabled={!platform || !type || !url || resolving || fetchingThumbnail}
          onClick={handleLoadPreview}
          className={secondaryButtonClass}
        >
          {resolving ? "Resolviendo enlace..." : fetchingThumbnail ? "Buscando portada..." : "Cargar preview"}
        </button>
      </div>

      <p className="text-xs text-ink/50">
        Puedes dejarlo en blanco si vas a subir tu propio video más abajo, sin depender de una publicación existente.
        {(platform === "instagram" || platform === "facebook") &&
          " Al cargar el preview intentamos traer la portada automáticamente; si no aparece, puedes subir una manualmente más abajo."}
      </p>

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
