import { put } from "@vercel/blob";

// Miniaturas de Instagram/Facebook: tanto el og:image del post como el media_url/thumbnail_url
// que devuelve la API de Meta son enlaces firmados y temporales (caducan y además bloquean el
// "hotlinking" desde otros dominios). Guardarlos tal cual es lo que hacía que, más tarde, la
// tarjeta se viera con la imagen rota. La solución: descargarla una vez y resubirla a nuestro
// propio Blob Store, así el link que queda guardado ya no depende de Instagram/Facebook.

const EPHEMERAL_HOSTS = [".cdninstagram.com", ".fbcdn.net", ".fbsbx.com"];

export function isEphemeralCdnUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return EPHEMERAL_HOSTS.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}

const OG_IMAGE_PATTERNS = [
  /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
];

function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/** Extrae la imagen de portada (og:image) de un post público, igual que hacen WhatsApp/Facebook al armar la vista previa de un link. */
export async function scrapeOgImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html",
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    for (const pattern of OG_IMAGE_PATTERNS) {
      const match = html.match(pattern);
      if (match) return decodeHtmlEntities(match[1]);
    }
    return null;
  } catch {
    return null;
  }
}

/** Descarga una imagen externa y la resube a nuestro Blob Store; null si algo falla (no hay que guardar un enlace a medias). */
export async function rehostImage(sourceUrl: string, pathPrefix: string): Promise<string | null> {
  const token = process.env.PUBLIC_BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;
  try {
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FoliocrewBot/1.0)" },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const buffer = Buffer.from(await response.arrayBuffer());
    const blob = await put(`${pathPrefix}/${Date.now()}.${ext}`, buffer, {
      access: "public",
      token,
      contentType,
      addRandomSuffix: true,
    });
    return blob.url;
  } catch {
    return null;
  }
}

/** Si la URL es de un CDN temporal de Meta, la resube a Blob; si ya es permanente (o no se pudo resolver), la deja igual. */
export async function ensurePermanentThumbnail(url: string | null, pathPrefix: string): Promise<string | null> {
  if (!url) return null;
  if (!isEphemeralCdnUrl(url)) return url;
  return rehostImage(url, pathPrefix);
}

/** Miniatura de un post de Instagram/Facebook a partir de su URL pública: la busca y la deja alojada en Blob. */
export async function resolvePermanentThumbnail(postUrl: string, platform: "instagram" | "facebook"): Promise<string | null> {
  const scraped = await scrapeOgImage(postUrl);
  if (!scraped) return null;
  return ensurePermanentThumbnail(scraped, `content-cards/thumbnails/${platform}`);
}
