import type { SocialProvider, StoredTokens, TokenSet } from "./types";

// Renovación de tokens sin base de datos (se prueba en tests/tiktok.test.ts). lib/social/accounts.ts
// la usa antes de CADA llamada a una red y guarda el resultado o el error.

const FIVE_MIN = 5 * 60_000;

/** Frase que marca un error que solo se arregla volviendo a conectar (la tarjeta la reconoce). */
const RECONNECT_PHRASE = "vuelve a conectar la cuenta";

export function reconnectMessage(label: string, detail?: string | null) {
  return `${label} ya no acepta la conexión guardada; ${RECONNECT_PHRASE}${detail ? ` (${detail})` : ""}`;
}

/** ¿El error guardado pide volver a conectar? (incluye el código 190 de Meta, que ya lo dice). */
export function needsReconnect(message: string | null | undefined) {
  return !!message && message.includes(RECONNECT_PHRASE);
}

/** Errores de la red que significan que el token o el permiso ya no sirven. */
export function isAuthFailure(message: string) {
  return /access_token_invalid|invalid_grant|invalid_token|token_expired|refresh_token|scope_not_authorized|unauthorized_client|invalid_client/i.test(message);
}

/** Fallas pasajeras (red caída, error del servidor, límite de pedidos): no se pide reconectar. */
function isTransient(message: string) {
  return /^HTTP 5\d\d|fetch failed|ECONN|ETIMEDOUT|ENOTFOUND|network|timeout|rate_limit/i.test(message);
}

export class ReconnectRequiredError extends Error {}

/** Convierte un error de una llamada a la red en el texto que se guarda en la tarjeta. */
export function describeAccountError(label: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Error desconocido";
  if (needsReconnect(message)) return message;
  if (isAuthFailure(message)) return reconnectMessage(label, message);
  return message;
}

/**
 * Renueva el token si hace falta (cada red decide cuándo en su `refresh`).
 * - Si la renovación falla y el token actual aún sirve, se sigue con él (se reintenta la próxima vez).
 * - Si falla y el token ya venció (TikTok: dura 24 h), lanza ReconnectRequiredError con un mensaje claro.
 * - Las fallas pasajeras y la falta de variables de entorno se lanzan tal cual.
 */
export async function renewTokens(
  provider: Pick<SocialProvider, "label" | "refresh">,
  tokens: StoredTokens,
  now = Date.now()
): Promise<{ tokens: StoredTokens; renewed: TokenSet | null }> {
  if (!provider.refresh) return { tokens, renewed: null };
  let renewed: TokenSet | null;
  try {
    renewed = await provider.refresh(tokens);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stillValid = tokens.expiresAt != null && tokens.expiresAt.getTime() - now > FIVE_MIN;
    if (stillValid) return { tokens, renewed: null };
    if (isTransient(message) || message.startsWith("Falta la variable de entorno")) throw error;
    throw new ReconnectRequiredError(reconnectMessage(provider.label, message));
  }
  if (!renewed) return { tokens, renewed: null };
  return {
    renewed,
    tokens: {
      ...tokens,
      accessToken: renewed.accessToken,
      // TikTok puede devolver un refresh token distinto: hay que usar el nuevo.
      refreshToken: renewed.refreshToken ?? tokens.refreshToken,
      expiresAt: renewed.expiresAt ?? null,
    },
  };
}
