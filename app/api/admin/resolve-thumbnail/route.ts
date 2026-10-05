import { NextResponse } from "next/server";
import { isSocialPostUrl, resolvePermanentThumbnail } from "@/lib/social/thumbnail";
import { resolveThumbnailViaAccount } from "@/lib/social/metrics-sync";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

/**
 * Busca la miniatura de un post de Instagram/Facebook y la deja alojada en nuestro Blob Store
 * (el link original de Meta caduca). Primero intenta por la cuenta conectada (API oficial, más
 * confiable); si no hay cuenta conectada o no encuentra el post ahí, cae al raspado público del
 * post (menos confiable: Instagram lo bloquea cada vez más).
 */
export async function GET(request: Request) {
  const { t } = await getT();
  const url = new URL(request.url).searchParams.get("url");
  const platform = new URL(request.url).searchParams.get("platform");
  if (!url) {
    return NextResponse.json({ error: t("Falta el parámetro url", "The url parameter is missing") }, { status: 400 });
  }
  if (!isSocialPostUrl(url)) {
    return NextResponse.json({ error: t("Solo se aceptan links de Instagram o Facebook", "Only Instagram or Facebook links are accepted") }, { status: 400 });
  }
  if (platform !== "instagram" && platform !== "facebook") {
    return NextResponse.json({ error: t("Falta o es inválido el parámetro platform", "The platform parameter is missing or invalid") }, { status: 400 });
  }

  const thumbnailUrl = (await resolveThumbnailViaAccount(platform, url)) ?? (await resolvePermanentThumbnail(url, platform));
  return NextResponse.json({ thumbnailUrl });
}
