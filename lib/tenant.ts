import { AsyncLocalStorage } from "node:async_hooks";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prismaRoot } from "./prisma-root";
import {
  RESERVED_SLUGS,
  SCOPE_HEADER,
  SESSION_CREATOR_HEADER,
  SESSION_USER_HEADER,
  SESSION_VERSION_HEADER,
  SESSION_ACTOR_HEADER,
  SITE_SLUG_HEADER,
} from "./tenant-headers";

// ─── ¿De qué creadora es esta petición? ───
//
// - Panel (/admin, /api/admin): la creadora de la sesión iniciada.
// - Sitio público: según el dominio:
//     <slug>.<PLATFORM_ROOT_DOMAIN>  → esa creadora
//     dominio propio (Creator.customDomain) → esa creadora
//     cualquier otro (p. ej. portafolio-cristal.vercel.app) → la creadora de la sesión
//       si hay una iniciada, o la creadora por defecto (DEFAULT_CREATOR_SLUG, "cristal").
// - Scripts y tareas fuera de una petición: runAsCreator(id, fn).

export class TenantError extends Error {}

const override = new AsyncLocalStorage<string>();

/** Ejecuta `fn` como si fuera una petición de la creadora `creatorId` (scripts, seed, tareas). */
export function runAsCreator<T>(creatorId: string, fn: () => Promise<T>): Promise<T> {
  return override.run(creatorId, fn);
}

export function platformRootDomain() {
  return (process.env.PLATFORM_ROOT_DOMAIN || "foliocrew.pro").toLowerCase();
}

export function defaultCreatorSlug() {
  return process.env.DEFAULT_CREATOR_SLUG || "cristal";
}

async function requestHeaders() {
  try {
    return await headers();
  } catch (error) {
    // Fuera de una petición (scripts). Cualquier otro error (p. ej. el aviso de
    // Next de que la página es dinámica) tiene que seguir su camino.
    if (error instanceof Error && error.message.includes("outside a request scope")) {
      throw new TenantError("Consulta sin creadora: usa runAsCreator() fuera de una petición");
    }
    throw error;
  }
}

/** Sesión iniciada (ya verificada por el middleware), o null. */
export async function getSession() {
  const h = await requestHeaders();
  const creatorId = h.get(SESSION_CREATOR_HEADER);
  const userId = h.get(SESSION_USER_HEADER);
  if (!creatorId || !userId) return null;
  const actorId = h.get(SESSION_ACTOR_HEADER) || null;
  const state = await sessionState(userId);
  // Contraseña cambiada (versión vieja), cuenta borrada o de otra creadora: la sesión ya no vale.
  if (state.version !== Number(h.get(SESSION_VERSION_HEADER) || 0) || state.creatorId !== creatorId) return null;
  // Cuenta pausada: solo quien administra Foliocrew puede verla ("Entrar como").
  if (state.creatorStatus !== "active" && !actorId) return null;
  return { creatorId, userId, actorId };
}

// Estado de cada usuario (caché corta): versión de sesión y estado de su cuenta. Al cambiar la
// contraseña sube la versión y al pausar la cuenta cambia el estado: las sesiones abiertas dejan
// de valer al momento en este servidor y en ≤30 s en los demás.
const sessionStates = new Map<
  string,
  { version: number | null; creatorId: string | null; creatorStatus: string | null; expires: number }
>();

async function sessionState(userId: string) {
  let cached = sessionStates.get(userId);
  if (!cached || cached.expires <= Date.now()) {
    const user = await prismaRoot.adminUser.findUnique({
      where: { id: userId },
      select: { sessionVersion: true, creatorId: true, creator: { select: { status: true } } },
    });
    cached = {
      version: user?.sessionVersion ?? null,
      creatorId: user?.creatorId ?? null,
      creatorStatus: user?.creator.status ?? null,
      expires: Date.now() + 30_000,
    };
    sessionStates.set(userId, cached);
  }
  return cached;
}

/** Para borrar la caché cuando cambia la contraseña de un usuario o el estado de su cuenta. */
export function forgetSessionVersion(...userIds: string[]) {
  for (const id of userIds) sessionStates.delete(id);
}

// Caché corta de dominio → creadora (evita una consulta por cada consulta).
const hostCache = new Map<string, { id: string | null; expires: number }>();
const HOST_CACHE_MS = 30_000;

async function creatorIdForHost(hostname: string): Promise<string | null | undefined> {
  const cached = hostCache.get(hostname);
  if (cached && cached.expires > Date.now()) return cached.id;

  const root = platformRootDomain().split(":")[0];
  let id: string | null | undefined;
  if (hostname.endsWith(`.${root}`)) {
    const slug = hostname.slice(0, -root.length - 1);
    if (slug.includes(".") || RESERVED_SLUGS.has(slug)) {
      id = undefined; // dominio de la plataforma (www, app…): no es de una creadora
    } else {
      const creator = await prismaRoot.creator.findUnique({ where: { slug }, select: { id: true, status: true } });
      id = creator && creator.status === "active" ? creator.id : null;
    }
  } else {
    // El dominio guardado puede tener o no "www.": se acepta la visita de cualquiera de las dos formas.
    const bare = hostname.replace(/^www\./, "");
    const creator = await prismaRoot.creator.findFirst({
      where: { customDomain: { in: [hostname, bare, `www.${bare}`] } },
      select: { id: true, status: true },
    });
    id = creator ? (creator.status === "active" ? creator.id : null) : undefined;
  }
  if (id) hostCache.set(hostname, { id, expires: Date.now() + HOST_CACHE_MS });
  return id;
}

let defaultCreatorId: { id: string; expires: number } | null = null;

async function getDefaultCreatorId() {
  if (defaultCreatorId && defaultCreatorId.expires > Date.now()) return defaultCreatorId.id;
  const creator = await prismaRoot.creator.findUnique({ where: { slug: defaultCreatorSlug() }, select: { id: true } });
  if (!creator) throw new TenantError(`No existe la creadora por defecto "${defaultCreatorSlug()}"`);
  defaultCreatorId = { id: creator.id, expires: Date.now() + HOST_CACHE_MS };
  return creator.id;
}

/** La creadora dueña de los datos de esta petición. Nunca devuelve "a cualquiera": si no sabe, falla. */
export async function currentCreatorId(): Promise<string> {
  const forced = override.getStore();
  if (forced) return forced;

  const h = await requestHeaders();
  const sessionCreator = h.get(SESSION_CREATOR_HEADER);
  if (h.get(SCOPE_HEADER) === "admin") {
    if (!sessionCreator || !(await getSession())) throw new TenantError("No hay sesión iniciada");
    return sessionCreator;
  }

  // Dirección provisional /s/<slug> (la pone el middleware).
  const siteSlug = h.get(SITE_SLUG_HEADER);
  if (siteSlug) {
    const creator = await prismaRoot.creator.findUnique({ where: { slug: siteSlug }, select: { id: true, status: true } });
    if (!creator || creator.status !== "active") notFound();
    return creator.id;
  }

  const hostname = (h.get("x-forwarded-host") || h.get("host") || "").split(":")[0].toLowerCase();
  const byHost = await creatorIdForHost(hostname);
  if (byHost === null) notFound(); // subdominio o dominio de una creadora que no existe o está pausada
  if (byHost) return byHost;
  return sessionCreator || getDefaultCreatorId();
}

/** La creadora de esta petición (nombre, slug y dominio). */
export async function currentCreator() {
  const id = await currentCreatorId();
  return prismaRoot.creator.findUniqueOrThrow({ where: { id }, select: { id: true, slug: true, name: true, customDomain: true } });
}

/** "/s/<slug>" si la página se abrió por la dirección provisional; "" en subdominio o dominio propio. */
export async function sitePathPrefix() {
  const slug = (await requestHeaders()).get(SITE_SLUG_HEADER);
  return slug ? `/s/${slug}` : "";
}

/** Para borrar la caché cuando cambia un dominio o un slug. */
export function forgetHost(hostname: string) {
  hostCache.delete(hostname.toLowerCase());
}
