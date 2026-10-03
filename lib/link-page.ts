import type { BioLink, BioLinkGroup } from "@prisma/client";
import { prisma } from "./prisma";

// Bloques del link en bio: grupos propios y los automáticos ("brandkit": media kit y contacto; "recent": Feed),
// en el orden que elige cada cuenta en el editor (/admin/enlaces).

export const AUTO_KINDS = ["brandkit", "recent"] as const;
export type GroupKind = "custom" | (typeof AUTO_KINDS)[number];

export type GroupWithLinks = BioLinkGroup & { links: BioLink[] };

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

/** Para la página pública: solo lee (los bloques automáticos que falten se agregan "virtuales" al final). */
export async function readLinkGroups(): Promise<GroupWithLinks[]> {
  const [groups, links] = await Promise.all([
    prisma.bioLinkGroup.findMany({ orderBy: { order: "asc" } }),
    prisma.bioLink.findMany({ orderBy: { order: "asc" } }),
  ]);
  const result: GroupWithLinks[] = groups.map((g) => ({ ...g, links: links.filter((l) => l.groupId === g.id) }));
  // Enlaces sin grupo (no debería pasar): van en un grupo "Mis enlaces" al principio.
  const orphans = links.filter((l) => !l.groupId || !groups.some((g) => g.id === l.groupId));
  if (orphans.length) result.unshift(virtualGroup("orphans", "custom", -1, orphans));
  let next = (groups.at(-1)?.order ?? 0) + 1;
  for (const kind of AUTO_KINDS) if (!groups.some((g) => g.kind === kind)) result.push(virtualGroup(`auto-${kind}`, kind, next++, []));
  return result.sort(byOrder);
}

function virtualGroup(id: string, kind: GroupKind, order: number, links: BioLink[]): GroupWithLinks {
  return { id, creatorId: "", kind, title: "", titleEn: null, hidden: false, order, links, createdAt: new Date(0) };
}

/** Para el editor: crea lo que falte (bloques automáticos, un grupo para enlaces sueltos) y devuelve todo en orden. */
export async function ensureLinkGroups(): Promise<GroupWithLinks[]> {
  let groups = await prisma.bioLinkGroup.findMany({ orderBy: { order: "asc" } });
  const settings = await prisma.siteSettings.findFirst({ select: { linksShowBrandKit: true, linksShowRecent: true } });
  let next = (groups.at(-1)?.order ?? -1) + 1;
  for (const kind of AUTO_KINDS) {
    if (groups.some((g) => g.kind === kind)) continue;
    const hidden = kind === "brandkit" ? settings?.linksShowBrandKit === false : settings?.linksShowRecent === false;
    groups.push(await prisma.bioLinkGroup.create({ data: { kind, hidden, order: next++ } }));
  }
  const orphans = await prisma.bioLink.findMany({ where: { OR: [{ groupId: null }, { groupId: { notIn: groups.map((g) => g.id) } }] } });
  if (orphans.length) {
    let target = groups.find((g) => g.kind === "custom");
    if (!target) {
      target = await prisma.bioLinkGroup.create({ data: { kind: "custom", title: "Mis enlaces", titleEn: "My links", order: -1 } });
      groups = [target, ...groups];
    }
    await prisma.bioLink.updateMany({ where: { id: { in: orphans.map((o) => o.id) } }, data: { groupId: target.id } });
  }
  const links = await prisma.bioLink.findMany({ orderBy: { order: "asc" } });
  return groups.sort(byOrder).map((g) => ({ ...g, links: links.filter((l) => l.groupId === g.id) }));
}
