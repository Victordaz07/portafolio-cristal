// Límite simple por clave (IP, correo…), en memoria de cada servidor: frena abusos básicos.
const buckets = new Map<string, number[]>();

/** true si `key` ya hizo más de `max` intentos en la ventana de `windowMs`. */
export function tooManyAttempts(key: string, max: number, windowMs = 60_000) {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  buckets.set(key, recent);
  return recent.length > max;
}

export function clientIp(request: Request) {
  return (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
}
