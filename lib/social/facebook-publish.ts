import { fetchJson } from "./http";
import type { NetResult, PublishKind } from "@/lib/publish";

// Publicar en una página de Facebook. Permiso: pages_manage_posts. Se usa el token de la página (no el de la persona).
// FACEBOOK_GRAPH_URL solo se usa en pruebas locales (servidor falso); en producción queda vacío.
const GRAPH = () => process.env.FACEBOOK_GRAPH_URL || `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v25.0"}`;

/** Publica en la primera página a la que la persona dio acceso. */
export async function publishToFacebook(opts: { userToken: string; kind: PublishKind; mediaUrl: string | null; caption: string }): Promise<NetResult> {
  const at = new Date().toISOString();
  const pages = await fetchJson<{ data?: { id: string; access_token?: string }[] }>(`${GRAPH()}/me/accounts?${new URLSearchParams({ fields: "id,access_token", access_token: opts.userToken })}`);
  const page = pages.data?.[0];
  if (!page?.access_token) throw new Error("No encontramos una página de Facebook con acceso para publicar");
  const post = (path: string, body: Record<string, string>) =>
    fetchJson<{ id?: string; post_id?: string }>(`${GRAPH()}/${page.id}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, access_token: page.access_token }),
    });
  let result: { id?: string; post_id?: string };
  if (opts.kind === "text") result = await post("feed", { message: opts.caption });
  else if (opts.kind === "image") result = await post("photos", { url: opts.mediaUrl as string, caption: opts.caption });
  else if (opts.kind === "video") result = await post("videos", { file_url: opts.mediaUrl as string, description: opts.caption });
  else throw new Error("Este tipo de contenido no se publica solo en Facebook");
  const id = result.post_id ?? result.id;
  if (!id) throw new Error("Facebook no confirmó la publicación");
  return { status: "ok", id, url: `https://www.facebook.com/${id}`, at };
}
