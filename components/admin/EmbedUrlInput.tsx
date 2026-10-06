"use client";

import { useState } from "react";
import { parseEmbedUrl, platformLabel, type Platform, type ContentType } from "@/lib/embeds";
import PlatformEmbed from "@/components/embeds/PlatformEmbed";
import { inputClass, secondaryButtonClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";

function isUnresolvedTikTokShortLink(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./, "");
    if (!(host === "tiktok.com" || host.endsWith(".tiktok.com"))) return false;
    return !/\/(?:video|photo)\/\d+/.test(parsed.pathname);
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
  const { t } = useT();
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
    // Quita los parámetros de rastreo que TikTok agrega al copiar el link (?is_from_webapp=…).
    if (platform === "tiktok" && /[?#]/.test(resolvedUrl)) {
      try {
        const clean = new URL(resolvedUrl);
        clean.search = "";
        clean.hash = "";
        resolvedUrl = clean.toString();
        onUrlChange(resolvedUrl, parseEmbedUrl(resolvedUrl));
      } catch {
        // URL inválida: se deja como está.
      }
    }
    setShowPreview(true);

    if (onThumbnailResolved && (platform === "instagram" || platform === "facebook")) {
      setFetchingThumbnail(true);
      try {
        const response = await fetch(
          `/api/admin/resolve-thumbnail?url=${encodeURIComponent(resolvedUrl)}&platform=${platform}`
        );
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
      <span className="text-sm font-medium text-ink">{t("URL del post", "Post URL")}</span>
      <div className="flex flex-wrap items-center gap-sp-3">
        <input
          type="url"
          value={url}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t("https://www.tiktok.com/@usuario/video/...", "https://www.tiktok.com/@user/video/...")}
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
          {resolving ? t("Resolviendo enlace...", "Resolving link...") : fetchingThumbnail ? t("Buscando portada...", "Finding cover...") : t("Cargar preview", "Load preview")}
        </button>
      </div>

      <p className="text-xs text-ink/50">
        {t("Puedes dejarlo en blanco si vas a subir tu propio video más abajo, sin depender de una publicación existente.", "You can leave it blank if you'll upload your own video below, without relying on an existing post.")}
        {(platform === "instagram" || platform === "facebook") &&
          t(" Al cargar el preview intentamos traer la portada automáticamente; si no aparece, puedes subir una manualmente más abajo.", " When loading the preview we try to fetch the cover automatically; if it doesn't appear, you can upload one manually below.")}
      </p>

      {!platform && url && (
        <p className="text-xs text-red-600">
          {t("No reconozco la plataforma de esa URL (debe ser de TikTok, Instagram o Facebook).", "I don't recognize that URL's platform (it must be TikTok, Instagram or Facebook).")}
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
