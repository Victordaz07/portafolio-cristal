import { notFound } from "next/navigation";
import { prismaRoot } from "./prisma-root";
import { getSession } from "./tenant";
import { isPlatformAdmin } from "./platform-admin";
import { hasFeature, type FeatureFlag } from "./feature-flags";

/** true si la sesión actual (cuenta embajadora o quien administra Foliocrew) puede ver esta función. */
export async function canSeeFeature(flag: FeatureFlag): Promise<boolean> {
  const session = await getSession();
  const [creator, platformAdmin] = await Promise.all([
    session ? prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { ambassador: true } }) : null,
    isPlatformAdmin(),
  ]);
  return hasFeature(flag, { ambassador: Boolean(creator?.ambassador), platformAdmin });
}

/**
 * Para el layout de una sección en lanzamiento gradual (ver lib/feature-flags.ts): 404 si la
 * cuenta todavía no puede verla. Cubre automáticamente todas sus páginas, incluidas las anidadas.
 */
export async function requireFeature(flag: FeatureFlag) {
  if (!(await canSeeFeature(flag))) notFound();
}
