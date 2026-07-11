export type Platform = "tiktok" | "instagram" | "facebook";
export type ContentType = "video" | "photo";

export interface ParsedEmbedUrl {
  platform: Platform | null;
  inferredType: ContentType | null;
}

/** Detecta plataforma y, cuando es posible, el tipo de contenido a partir de la URL del post. */
export function parseEmbedUrl(rawUrl: string): ParsedEmbedUrl {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { platform: null, inferredType: null };
  }

  const host = url.hostname.replace(/^www\./, "");
  const path = url.pathname;

  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    return { platform: "tiktok", inferredType: "video" };
  }

  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    if (path.includes("/reel/")) return { platform: "instagram", inferredType: "video" };
    if (path.includes("/p/")) return { platform: "instagram", inferredType: null };
    return { platform: "instagram", inferredType: null };
  }

  if (host === "facebook.com" || host === "fb.watch" || host.endsWith(".facebook.com")) {
    if (path.includes("/videos/") || host === "fb.watch") {
      return { platform: "facebook", inferredType: "video" };
    }
    if (path.includes("/posts/")) return { platform: "facebook", inferredType: "photo" };
    return { platform: "facebook", inferredType: null };
  }

  return { platform: null, inferredType: null };
}

export function platformLabel(platform: Platform): string {
  switch (platform) {
    case "tiktok":
      return "TT";
    case "instagram":
      return "IG";
    case "facebook":
      return "PIC";
  }
}
