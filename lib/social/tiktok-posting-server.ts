import { NextResponse } from "next/server";
import type { SocialAccount } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { getFreshTokens, reportAccountError } from "./accounts";
import { describeAccountError, needsReconnect } from "./token-refresh";
import { POSTING_REASON_TEXT, TikTokPostingError, isTikTokVideoType, tiktokPostingErrorText, tiktokPostingFlags } from "./tiktok-posting";

// Piezas comunes de las rutas /api/admin/tiktok/* (Content Posting API). Ver lib/social/tiktok-posting.ts.

type T = (es: string, en: string) => string;
export type PostingMode = "draft" | "direct";

export const SCOPE_FOR: Record<PostingMode, string> = { draft: "video.upload", direct: "video.publish" };

/**
 * Comprueba que el modo esté activado, que haya sesión propia y que TikTok esté conectado con el
 * permiso. Devuelve la cuenta con tokens renovados, o la respuesta de error lista para devolver.
 */
export async function loadPostingAccount(
  t: T,
  modes: PostingMode[]
): Promise<{ account: SocialAccount; accessToken: string } | { response: NextResponse }> {
  const flags = tiktokPostingFlags();
  // Apagado: la ruta no existe (404), igual que si no estuviera en el código.
  if (!modes.some((mode) => flags[mode])) return { response: NextResponse.json({ error: t("No encontrado", "Not found") }, { status: 404 }) };
  const session = await getSession();
  if (session?.actorId) {
    return { response: NextResponse.json({ error: t("El equipo no publica en nombre de una cuenta", "The team doesn't publish on behalf of an account") }, { status: 403 }) };
  }
  const account = await prisma.socialAccount.findFirst({ where: { platform: "tiktok" } });
  if (!account) return { response: NextResponse.json({ error: t("Primero conecta tu TikTok.", "Connect your TikTok first.") }, { status: 400 }) };
  if (!modes.some((mode) => flags[mode] && account.scopes.includes(SCOPE_FOR[mode]))) {
    return {
      response: NextResponse.json(
        { error: t("Falta un permiso: vuelve a conectar TikTok para autorizar la publicación.", "A permission is missing: reconnect TikTok to authorize posting."), reconnect: true },
        { status: 400 }
      ),
    };
  }
  try {
    const { tokens } = await getFreshTokens(account);
    return { account, accessToken: tokens.accessToken };
  } catch (error) {
    return { response: await postingErrorResponse(t, account, error) };
  }
}

/** Respuesta para cualquier error al publicar: reglas propias, errores conocidos de TikTok o token vencido. */
export async function postingErrorResponse(t: T, account: Pick<SocialAccount, "id" | "platform"> | null, error: unknown) {
  if (error instanceof TikTokPostingError) {
    const [es, en] = POSTING_REASON_TEXT[error.reason];
    return NextResponse.json({ error: t(es, en), reason: error.reason }, { status: 400 });
  }
  const raw = error instanceof Error ? error.message : "Error desconocido";
  const known = tiktokPostingErrorText(raw);
  if (known) return NextResponse.json({ error: t(known[0], known[1]) }, { status: 400 });
  const message = describeAccountError("TikTok", error);
  if (needsReconnect(message)) {
    // Queda también en la tarjeta de /admin/conectar.
    if (account) await reportAccountError(account, error);
    return NextResponse.json({ error: t("TikTok cerró la conexión con Foliocrew: vuelve a conectar la cuenta en Conectar cuentas.", "TikTok closed the connection with Foliocrew: reconnect the account in Connect accounts."), reconnect: true }, { status: 401 });
  }
  console.error("TikTok Content Posting:", raw);
  return NextResponse.json({ error: `TikTok: ${raw}` }, { status: 502 });
}

/** Solo videos de nuestro propio Blob Store (los sube el panel): evita que el servidor descargue cualquier URL. */
export function isOwnBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/**
 * Tamaño, tipo y un lector por rangos del video guardado en Blob. TikTok no puede bajarlo él mismo
 * (PULL_FROM_URL exige un dominio verificado y Blob no es nuestro dominio), así que se sube por partes.
 */
export async function openBlobVideo(url: string) {
  const head = await fetch(url, { method: "HEAD", cache: "no-store" });
  if (!head.ok) throw new Error(`No se pudo leer el video (HTTP ${head.status})`);
  const size = Number(head.headers.get("content-length"));
  const contentType = (head.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!Number.isInteger(size) || size <= 0) throw new TikTokPostingError("video_size");
  if (!isTikTokVideoType(contentType)) throw new TikTokPostingError("video_type");

  let whole: Uint8Array | null = null;
  async function readRange(start: number, end: number) {
    if (whole) return whole.subarray(start, end + 1);
    const response = await fetch(url, { headers: { Range: `bytes=${start}-${end}` }, cache: "no-store" });
    if (response.status === 206) return new Uint8Array(await response.arrayBuffer());
    // Si el servidor ignora el rango, se baja una vez completo y se corta en memoria.
    if (response.ok) {
      whole = new Uint8Array(await response.arrayBuffer());
      return whole.subarray(start, end + 1);
    }
    throw new Error(`No se pudo leer el video (HTTP ${response.status})`);
  }
  return { size, contentType, readRange };
}
