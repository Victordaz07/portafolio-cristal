import { del } from "@vercel/blob";

// Borra blobs de Vercel Blob que quedaron huérfanos al reemplazar o borrar una foto/video
// (hero, logo de marca, tarjeta del feed…). Nunca se llamaba `del()` en el repo, así que cada
// reemplazo dejaba el archivo anterior ocupando espacio para siempre (ver auditoría FinOps).
//
// Solo actúa sobre URLs de nuestro propio store: un enlace externo pegado a mano (otro dominio)
// nunca se toca. Es "best effort": si el borrado falla, se registra pero no interrumpe al usuario
// (su guardado/borrado ya se aplicó en la base de datos).

export function isOwnBlobUrl(url: string) {
  try {
    return new URL(url).hostname.endsWith(".vercel-storage.com");
  } catch {
    return false;
  }
}

export async function cleanupBlobUrls(urls: Array<string | null | undefined>) {
  const targets = Array.from(new Set(urls.filter((url): url is string => !!url && isOwnBlobUrl(url))));
  await Promise.all(
    targets.map((url) =>
      del(url).catch((error) => {
        console.error("No se pudo borrar el blob huérfano", url, error);
      })
    )
  );
}
