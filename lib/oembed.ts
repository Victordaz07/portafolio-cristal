import type { Platform } from "@/lib/embeds";

const OEMBED_ENDPOINTS: Partial<Record<Platform, string>> = {
  tiktok: "https://www.tiktok.com/oembed",
};

/** Trae la miniatura real del post vía oEmbed (hoy solo TikTok soporta oEmbed público). */
export async function getThumbnailUrl(platform: Platform, postUrl: string): Promise<string | null> {
  const endpoint = OEMBED_ENDPOINTS[platform];
  if (!endpoint) return null;

  try {
    const response = await fetch(`${endpoint}?url=${encodeURIComponent(postUrl)}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;

    const data = await response.json();
    return typeof data.thumbnail_url === "string" ? data.thumbnail_url : null;
  } catch {
    return null;
  }
}
