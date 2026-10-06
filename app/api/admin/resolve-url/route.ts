import { NextResponse } from "next/server";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

function isTikTokUrl(value: string) {
  try {
    const { protocol, hostname } = new URL(value);
    return protocol === "https:" && (hostname === "tiktok.com" || hostname.endsWith(".tiktok.com"));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { t } = await getT();
  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: t("Falta el parámetro url", "The url parameter is missing") }, { status: 400 });
  }
  // Solo enlaces cortos de TikTok (vm./vt.tiktok.com, tiktok.com/t/…): el servidor no debe pedir
  // cualquier dirección que llegue del navegador (p. ej. una interna).
  if (!isTikTokUrl(url)) {
    return NextResponse.json({ error: t("Solo se aceptan enlaces de TikTok", "Only TikTok links are accepted") }, { status: 400 });
  }

  try {
    const response = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(8000) });
    // Si la redirección terminó fuera de TikTok, no se devuelve.
    if (!isTikTokUrl(response.url)) return NextResponse.json({ error: t("No se pudo resolver la URL", "Couldn't resolve the URL") }, { status: 400 });
    return NextResponse.json({ resolvedUrl: response.url });
  } catch {
    return NextResponse.json({ error: t("No se pudo resolver la URL", "Couldn't resolve the URL") }, { status: 400 });
  }
}
