import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { sitePathPrefix } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// Sitemap del sitio que se está visitando (cada creadora tiene el suyo en su dominio).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.split(":")[0].endsWith("localhost") ? "http" : "https");
  const base = `${proto}://${host}${await sitePathPrefix()}`;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/media-kit`, changeFrequency: "weekly", priority: 0.8 },
  ];
}
