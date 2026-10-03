import { createHmac, timingSafeEqual } from "node:crypto";
import { prismaRoot } from "@/lib/prisma-root";

// Meta (Instagram y Facebook) avisa a la app cuando alguien la desconecta o pide borrar sus datos,
// con un `signed_request` firmado con el secreto de la app. Ver docs/revision-de-apps.md.

const decode = (part: string) => Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64");

/** Verifica la firma con el secreto de la app de Instagram o de Facebook. Devuelve el user_id o null. */
export function parseSignedRequest(signedRequest: string | null): string | null {
  if (!signedRequest || !signedRequest.includes(".")) return null;
  const [signature, payload] = signedRequest.split(".", 2);
  const secrets = [process.env.INSTAGRAM_APP_SECRET, process.env.FACEBOOK_APP_SECRET].filter(Boolean) as string[];
  const given = decode(signature);
  const valid = secrets.some((secret) => {
    const expected = createHmac("sha256", secret).update(payload).digest();
    return expected.length === given.length && timingSafeEqual(expected, given);
  });
  if (!valid) return null;
  try {
    const data = JSON.parse(decode(payload).toString("utf8")) as { user_id?: unknown; algorithm?: string };
    if (data.algorithm && data.algorithm.toUpperCase() !== "HMAC-SHA256") return null;
    return data.user_id != null ? String(data.user_id) : null;
  } catch {
    return null;
  }
}

/** Lee el signed_request del cuerpo (form o JSON) que manda Meta. */
export async function readSignedRequest(request: Request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { signed_request?: string };
    return body.signed_request ?? null;
  }
  const form = await request.formData().catch(() => null);
  const value = form?.get("signed_request");
  return typeof value === "string" ? value : null;
}

/** Borra las conexiones de Meta de esa persona (tokens, perfil y su historial de seguidores). */
export async function deleteMetaConnections(userId: string) {
  const accounts = await prismaRoot.socialAccount.findMany({
    where: { platform: { in: ["instagram", "facebook"] }, OR: [{ externalId: userId }, { scopedId: userId }] },
    select: { id: true, creatorId: true, platform: true },
  });
  for (const account of accounts) {
    await prismaRoot.$transaction([
      prismaRoot.followerSnapshot.deleteMany({ where: { creatorId: account.creatorId, platform: account.platform } }),
      prismaRoot.socialAccount.delete({ where: { id: account.id } }),
    ]);
  }
  return accounts.length;
}
