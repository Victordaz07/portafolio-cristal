import { cache } from "react";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { prismaRoot } from "./prisma-root";
import { getSession } from "./tenant";
import { isPlatformAdmin } from "./platform-admin";
import { getT } from "./admin-lang-server";
import {
  RELEASE_MODULES,
  COMMUNITY_MODULES,
  moduleVisible,
  navEntry,
  nextPublicAt,
  resolveReleases,
  type NavTag,
  type ReleaseLevel,
  type ReleaseMap,
  type Viewer,
} from "./releases";

// Lectura y guardado del lanzamiento por temporadas (la lógica pura está en lib/releases.ts).

/** Posición de todos los módulos (una consulta por petición). Si la tabla aún no existe, las posiciones por defecto. */
export const getReleases = cache(async (): Promise<ReleaseMap> => {
  const rows = await prismaRoot.featureRelease.findMany().catch((error) => {
    console.error("No se pudieron leer los lanzamientos; se usan las posiciones por defecto", error);
    return [];
  });
  return resolveReleases(rows);
});

/** Quién está mirando: si su cuenta es embajadora y si administra Foliocrew. */
export const currentViewer = cache(async (): Promise<Viewer> => {
  const session = await getSession();
  if (!session) return { ambassador: false, platformAdmin: false };
  const [creator, platformAdmin] = await Promise.all([
    prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { ambassador: true } }),
    isPlatformAdmin(),
  ]);
  return { ambassador: Boolean(creator?.ambassador), platformAdmin };
});

/** ¿La cuenta de esta petición puede usar el módulo? */
export async function canUseModule(id: string) {
  const [map, viewer] = await Promise.all([getReleases(), currentViewer()]);
  return moduleVisible(map, id, viewer);
}

/** Para páginas del panel: si el módulo no está abierto para esta cuenta, la página no existe (404). */
export async function requireModule(id: string) {
  if (!(await canUseModule(id))) notFound();
}

/** Para la comunidad: «Mi perfil», reglas y publicaciones se ven si al menos un módulo de la comunidad está abierto. */
export async function requireAnyCommunity() {
  const [map, viewer] = await Promise.all([getReleases(), currentViewer()]);
  if (!COMMUNITY_MODULES.some((m) => moduleVisible(map, m, viewer))) notFound();
}

/** Para APIs del panel: respuesta 404 si el módulo no está abierto, o null si se puede seguir. */
export async function moduleBlockedResponse(id: string) {
  if (await canUseModule(id)) return null;
  const { t } = await getT();
  return NextResponse.json({ error: t("Esta función todavía no está disponible para tu cuenta", "This feature isn't available for your account yet") }, { status: 404 });
}

/** Cómo se ve cada entrada del menú (las que no aparecen aquí se ven normal). */
export async function navAccess(hrefs: string[]): Promise<Record<string, { hidden: boolean; tag: NavTag }>> {
  const [map, viewer] = await Promise.all([getReleases(), currentViewer()]);
  const now = new Date();
  return Object.fromEntries(hrefs.map((href) => [href, navEntry(href, map, viewer, now)]));
}

/** Módulos que esta cuenta embajadora prueba antes que el resto (para su panel). */
export async function earlyModules() {
  const map = await getReleases();
  return RELEASE_MODULES.filter((m) => map[m.id]?.level === "amb");
}

/** Cambia la posición de uno o varios módulos. Devuelve los que de verdad cambiaron. */
export async function setReleaseLevels(ids: string[], level: ReleaseLevel, actorEmail: string) {
  const current = await prismaRoot.featureRelease.findMany({ where: { id: { in: ids } } });
  const map = resolveReleases(current);
  const now = new Date();
  const changed: { id: string; from: ReleaseLevel }[] = [];
  for (const id of ids) {
    const previous = map[id];
    if (!previous || previous.level === level) continue;
    const publicAt = nextPublicAt(previous, level, now);
    await prismaRoot.featureRelease.upsert({
      where: { id },
      create: { id, level, publicAt, updatedBy: actorEmail },
      update: { level, publicAt, updatedBy: actorEmail },
    });
    changed.push({ id, from: previous.level });
  }
  return changed;
}
