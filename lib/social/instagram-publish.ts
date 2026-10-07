import { fetchJson } from "./http";
import type { NetResult, PublishKind } from "@/lib/publish";

// Publicar en Instagram (Instagram API con Instagram Login): primero se crea un «contenedor» con el archivo,
// los videos tardan en procesarse, y después se publica. Permiso: instagram_business_content_publish.
// INSTAGRAM_GRAPH_URL solo se usa en pruebas locales (servidor falso); en producción queda vacío.
const GRAPH = () => process.env.INSTAGRAM_GRAPH_URL || `https://graph.instagram.com/${process.env.META_GRAPH_VERSION || "v25.0"}`;
const POLL_TRIES = 6;
const pollMs = () => Number(process.env.PUBLISH_POLL_MS) || 3000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const headers = (token: string) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

function containerBody(kind: PublishKind, mediaUrl: string, caption: string): Record<string, string> {
  switch (kind) {
    case "image":
      return { image_url: mediaUrl, caption };
    case "video":
      return { media_type: "REELS", video_url: mediaUrl, caption };
    case "story_image":
      return { media_type: "STORIES", image_url: mediaUrl };
    case "story_video":
      return { media_type: "STORIES", video_url: mediaUrl };
    default:
      throw new Error("Instagram no publica solo texto");
  }
}

/** Publica (o sigue publicando) una pieza. Si el video aún se procesa, devuelve «pending» con el contenedor para el siguiente intento. */
export async function publishToInstagram(opts: { igId: string; token: string; kind: PublishKind; mediaUrl: string; caption: string; creationId?: string }): Promise<NetResult> {
  const at = new Date().toISOString();
  const isVideo = opts.kind === "video" || opts.kind === "story_video";
  let creationId = opts.creationId;
  if (!creationId) {
    const created = await fetchJson<{ id?: string }>(`${GRAPH()}/${opts.igId}/media`, { method: "POST", headers: headers(opts.token), body: JSON.stringify(containerBody(opts.kind, opts.mediaUrl, opts.caption)) });
    if (!created.id) throw new Error("Instagram no devolvió el contenedor");
    creationId = created.id;
  }
  if (isVideo) {
    let finished = false;
    for (let i = 0; i < POLL_TRIES; i += 1) {
      const status = await fetchJson<{ status_code?: string }>(`${GRAPH()}/${creationId}?fields=status_code`, { headers: { Authorization: `Bearer ${opts.token}` } });
      if (status.status_code === "FINISHED") {
        finished = true;
        break;
      }
      if (status.status_code === "ERROR" || status.status_code === "EXPIRED") throw new Error(`Instagram no pudo procesar el video (${status.status_code})`);
      await sleep(pollMs());
    }
    if (!finished) return { status: "pending", creationId, at };
  }
  const published = await fetchJson<{ id?: string }>(`${GRAPH()}/${opts.igId}/media_publish`, { method: "POST", headers: headers(opts.token), body: JSON.stringify({ creation_id: creationId }) });
  if (!published.id) throw new Error("Instagram no confirmó la publicación");
  let url: string | undefined;
  try {
    const info = await fetchJson<{ permalink?: string }>(`${GRAPH()}/${published.id}?fields=permalink`, { headers: { Authorization: `Bearer ${opts.token}` } });
    url = info.permalink;
  } catch {
    // El enlace es opcional: si falla, la publicación igual salió.
  }
  return { status: "ok", id: published.id, url, at };
}
