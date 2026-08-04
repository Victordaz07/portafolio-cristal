import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const OG_IMAGE_PATTERNS = [
  /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
];

function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/** Extrae la imagen de portada (og:image) de un post público, igual que hacen WhatsApp/Facebook al armar la vista previa de un link. */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Falta el parámetro url" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html",
      },
    });
    if (!response.ok) {
      return NextResponse.json({ thumbnailUrl: null });
    }

    const html = await response.text();
    let match: RegExpMatchArray | null = null;
    for (const pattern of OG_IMAGE_PATTERNS) {
      match = html.match(pattern);
      if (match) break;
    }

    return NextResponse.json({ thumbnailUrl: match ? decodeHtmlEntities(match[1]) : null });
  } catch {
    return NextResponse.json({ thumbnailUrl: null });
  }
}
