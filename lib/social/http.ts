/** fetch + JSON que convierte los errores de cada API en un mensaje legible. */
export async function fetchJson<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Respuesta no-JSON: se reporta tal cual abajo.
  }
  const apiError = extractError(data);
  if (!response.ok || apiError) {
    throw new Error(apiError ?? `HTTP ${response.status}: ${text.slice(0, 200)}`);
  }
  return data as T;
}

function extractError(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  // Meta: { error: { message } } · Google: { error: "...", error_description } · TikTok: { error: { code, message } }
  if (d.error && typeof d.error === "object") {
    const e = d.error as Record<string, unknown>;
    if (e.code === "ok") return null; // TikTok responde error.code = "ok" cuando todo salió bien
    if (e.code === 190) {
      // Meta: token inválido, vencido o revocado.
      return `El token ya no es válido; vuelve a conectar la cuenta (Meta, código 190: ${e.message ?? "sin detalle"})`;
    }
    return String(e.message ?? e.code ?? "Error de la API");
  }
  if (typeof d.error === "string") {
    return d.error_description ? `${d.error}: ${d.error_description}` : d.error;
  }
  if (typeof d.error_message === "string") return d.error_message;
  return null;
}

export function formBody(params: Record<string, string>) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  } satisfies RequestInit;
}

export function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export function secondsFromNow(seconds: unknown) {
  const n = Number(seconds);
  return Number.isFinite(n) && n > 0 ? new Date(Date.now() + n * 1000) : null;
}
