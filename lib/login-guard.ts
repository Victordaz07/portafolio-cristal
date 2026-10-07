// Bloqueo temporal por intentos fallidos, guardado en la base (AdminUser.failedLogins / lockedUntil).
// El límite en memoria (lib/rate-limit.ts) se reinicia en cada servidor de Vercel; este no: frena el
// adivinar contraseñas o códigos aunque los intentos lleguen desde muchas IP.

export const MAX_FAILED_LOGINS = 10;
export const LOCK_MINUTES = 15;

export function isLocked(lockedUntil: Date | null | undefined, now: Date = new Date()) {
  return Boolean(lockedUntil && lockedUntil > now);
}

/** Qué guardar después de un intento fallido, dado el contador ya incrementado. */
export function afterFailure(failedLogins: number, now: Date = new Date()): { failedLogins: number; lockedUntil: Date | null } {
  if (failedLogins < MAX_FAILED_LOGINS) return { failedLogins, lockedUntil: null };
  // Se bloquea y el contador vuelve a cero: al terminar el bloqueo hay otros 10 intentos.
  return { failedLogins: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) };
}

/**
 * ¿La petición viene de la misma dirección que la recibe? Los navegadores mandan `Origin` en toda
 * petición que cambia datos; si viene de otro sitio (aunque sea otro subdominio), se rechaza.
 * Sin `Origin` (curl, servidores, el aviso de Vercel Blob) no hay navegador de por medio: pasa.
 */
export function sameOrigin(origin: string | null, hosts: (string | null | undefined)[]) {
  if (!origin) return true;
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  return hosts.some((h) => h && h.toLowerCase() === host);
}
