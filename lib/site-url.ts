import { headers } from "next/headers";
import { prismaRoot } from "./prisma-root";
import { getSession } from "./tenant";

// ─── La dirección pública del sitio de cada creadora ───
// 1. Su dominio propio, si ya está verificado (https://crisliaugc.com)
// 2. Su subdominio, si la plataforma ya tiene dominio (PLATFORM_ROOT_DOMAIN → https://cristal.foliocrew.pro)
// 3. La dirección provisional en el dominio actual de la app (https://portafolio-cristal.vercel.app/s/cristal)

export interface SiteCreator {
  slug: string;
  customDomain: string | null;
  customDomainVerifiedAt: Date | null;
}

/** ¿Están activos los subdominios <slug>.<dominio>? Solo cuando PLATFORM_ROOT_DOMAIN está configurado. */
export function subdomainsEnabled() {
  return Boolean(process.env.PLATFORM_ROOT_DOMAIN);
}

function protocolFor(host: string) {
  const hostname = host.split(":")[0];
  return hostname === "localhost" || hostname.endsWith(".localhost") ? "http" : "https";
}

/** https://<slug>.<PLATFORM_ROOT_DOMAIN> */
export function subdomainUrl(slug: string) {
  const root = (process.env.PLATFORM_ROOT_DOMAIN || "foliocrew.pro").toLowerCase();
  return `${protocolFor(root)}://${slug}.${root}`;
}

/** Origen de la app (APP_URL o el dominio de esta petición). */
export async function appOrigin() {
  const configured = (process.env.APP_URL || "").replace(/\/$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${h.get("x-forwarded-proto") || protocolFor(host)}://${host}`;
}

/** Origen de la plataforma para los enlaces de los correos: https://foliocrew.pro (o el de esta petición). */
export async function platformOrigin() {
  const root = (process.env.PLATFORM_ROOT_DOMAIN || "").toLowerCase();
  return root ? `${protocolFor(root)}://${root}` : appOrigin();
}

/** La dirección "oficial" del sitio de la creadora (para compartir con marcas). */
export async function creatorSiteUrl(creator: SiteCreator) {
  if (creator.customDomain && creator.customDomainVerifiedAt) return `https://${creator.customDomain}`;
  if (subdomainsEnabled()) return subdomainUrl(creator.slug);
  return `${await appOrigin()}/s/${creator.slug}`;
}

/** Ruta en el dominio actual (mismo origen) para ver el sitio desde el panel. */
export function sitePreviewPath(slug: string) {
  return `/s/${slug}`;
}

/** Dirección oficial y ruta provisional de la creadora con sesión iniciada (para el panel). */
export async function sessionCreatorSite() {
  const session = await getSession();
  if (!session) return null;
  const creator = await prismaRoot.creator.findUnique({
    where: { id: session.creatorId },
    select: { slug: true, customDomain: true, customDomainVerifiedAt: true },
  });
  if (!creator) return null;
  return { url: await creatorSiteUrl(creator), previewPath: sitePreviewPath(creator.slug) };
}
