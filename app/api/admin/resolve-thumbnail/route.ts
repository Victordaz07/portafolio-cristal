import { NextResponse } from "next/server";
import { resolvePermanentThumbnail } from "@/lib/social/thumbnail";

export const dynamic = "force-dynamic";

/** Busca la miniatura (og:image) de un post de Instagram/Facebook y la deja alojada en nuestro Blob Store (el link original de Meta caduca). */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  const platform = new URL(request.url).searchParams.get("platform");
  if (!url) {
    return NextResponse.json({ error: "Falta el parámetro url" }, { status: 400 });
  }
  if (platform !== "instagram" && platform !== "facebook") {
    return NextResponse.json({ error: "Falta o es inválido el parámetro platform" }, { status: 400 });
  }

  const thumbnailUrl = await resolvePermanentThumbnail(url, platform);
  return NextResponse.json({ thumbnailUrl });
}
