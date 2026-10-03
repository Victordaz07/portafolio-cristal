import { prismaRoot } from "./prisma-root";
import { NICHES } from "./onboarding";
import { engagementRate } from "./metrics";
import { HEATMAP_DAYS, HEATMAP_SLOTS } from "./reports";
import { appTimeZone } from "./growth-server";

// Analítica de toda la plataforma para el centro de mando (solo quien administra Foliocrew).
// Lee todas las cuentas sin filtro por creadora: nunca usar desde páginas de una cuenta.

const DAY = 86_400_000;
/** Mínimo de vistas para que una publicación cuente en rankings y promedios (evita ruido de 3 vistas). */
export const MIN_VIEWS = 100;

/** Nicho normalizado a partir del texto de la portada ("Skincare", "Moda"…). */
export function nicheOf(label: string | null | undefined) {
  const text = (label || "").trim().toLowerCase();
  const found = NICHES.find((n) => n.id !== "otro" && (n.label.toLowerCase() === text || n.labelEn.toLowerCase() === text || text.includes(n.label.toLowerCase())));
  return found ? { id: found.id, label: found.label } : { id: "otro", label: "Otros / varios" };
}

export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(value * 10) / 10;
}

function slotOf(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(date);
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.find((p) => p.type === "weekday")!.value);
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  const h = hour < 6 ? hour + 24 : hour;
  const slot = HEATMAP_SLOTS.findIndex((s) => h >= s.from && h < s.to);
  return { day, slot };
}

/** Todas las publicaciones con métricas útiles, con su cuenta y nicho. */
async function allPosts() {
  const cards = await prismaRoot.contentCard.findMany({
    // YouTube queda fuera de la analítica entre cuentas (uso limitado de las APIs de Google).
    where: { views: { gte: MIN_VIEWS }, platform: { not: "youtube" } },
    select: {
      id: true,
      creatorId: true,
      platform: true,
      type: true,
      caption: true,
      category: true,
      postUrl: true,
      views: true,
      likes: true,
      comments: true,
      shares: true,
      saves: true,
      postedAt: true,
      brandId: true,
      creator: { select: { name: true, slug: true, hero: { select: { niche: true } } } },
    },
  });
  return cards
    .map((c) => ({ ...c, er: engagementRate(c), niche: nicheOf(c.creator.hero?.niche) }))
    .filter((c): c is typeof c & { er: number } => c.er != null);
}

export type PlatformPost = Awaited<ReturnType<typeof allPosts>>[number];

// ─── Resumen ───

/** Altas de cuentas por semana (últimas N semanas, lunes a domingo). */
export async function signupsByWeek(weeks = 12) {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)));
  const start = new Date(monday.getTime() - (weeks - 1) * 7 * DAY);
  const creators = await prismaRoot.creator.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } });
  return Array.from({ length: weeks }, (_, i) => {
    const from = new Date(start.getTime() + i * 7 * DAY);
    const to = new Date(from.getTime() + 7 * DAY);
    return {
      week: from.toISOString().slice(0, 10),
      label: from.toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "UTC" }),
      count: creators.filter((c) => c.createdAt >= from && c.createdAt < to).length,
    };
  });
}

// ─── Creadores ───

export async function creatorLeaderboard() {
  const since = new Date(Date.now() - 45 * DAY).toISOString().slice(0, 10);
  const [creators, snapshots, posts, deals] = await Promise.all([
    prismaRoot.creator.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        hero: { select: { niche: true } },
        socialAccounts: { select: { platform: true, followers: true } },
        users: { where: { role: "owner" }, take: 1, select: { lastLoginAt: true } },
        _count: { select: { contentCards: true, scheduledPosts: true } },
      },
    }),
    prismaRoot.followerSnapshot.findMany({ where: { date: { gte: since } }, select: { creatorId: true, platform: true, date: true, followers: true } }),
    allPosts(),
    prismaRoot.brand.findMany({
      where: { dealValue: { gt: 0 } },
      select: { creatorId: true, dealValue: true, paymentStatus: true, dealStatus: true },
    }),
  ]);
  const cutoff = new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10);

  return creators.map((c) => {
    // Seguidores: el dato más reciente por red (historial o cuenta conectada) y el de hace ~30 días.
    const byPlatform = new Map<string, { latest?: { date: string; followers: number }; past?: { date: string; followers: number } }>();
    for (const s of snapshots.filter((s) => s.creatorId === c.id)) {
      const entry = byPlatform.get(s.platform) ?? {};
      if (!entry.latest || s.date > entry.latest.date) entry.latest = s;
      if (s.date <= cutoff && (!entry.past || s.date > entry.past.date)) entry.past = s;
      byPlatform.set(s.platform, entry);
    }
    for (const a of c.socialAccounts) {
      if (!byPlatform.has(a.platform) && a.followers != null) byPlatform.set(a.platform, { latest: { date: "", followers: a.followers } });
    }
    let followers = 0;
    let pastTotal = 0;
    let comparable = 0;
    for (const entry of Array.from(byPlatform.values())) {
      followers += entry.latest?.followers ?? 0;
      if (entry.latest && entry.past) {
        comparable += entry.latest.followers;
        pastTotal += entry.past.followers;
      }
    }
    const growth = pastTotal > 0 ? Math.round(((comparable - pastTotal) / pastTotal) * 1000) / 10 : null;
    const mine = posts.filter((p) => p.creatorId === c.id);
    const top = [...mine].sort((a, b) => b.er - a.er)[0] ?? null;
    const myDeals = deals.filter((d) => d.creatorId === c.id);
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      status: c.status,
      niche: nicheOf(c.hero?.niche).label,
      followers,
      growth,
      networks: Array.from(byPlatform.keys()),
      medianEr: median(mine.map((p) => p.er)),
      measuredPosts: mine.length,
      totalPosts: c._count.contentCards,
      planned: c._count.scheduledPosts,
      topPost: top ? { er: top.er, views: top.views ?? 0, caption: top.caption.slice(0, 80), url: top.postUrl } : null,
      deals: myDeals.length,
      revenue: myDeals.filter((d) => d.paymentStatus === "paid").reduce((s, d) => s + (d.dealValue ?? 0), 0),
      pipeline: myDeals.filter((d) => d.paymentStatus !== "paid").reduce((s, d) => s + (d.dealValue ?? 0), 0),
      lastLoginAt: c.users[0]?.lastLoginAt?.toISOString() ?? null,
    };
  });
}

export type LeaderboardRow = Awaited<ReturnType<typeof creatorLeaderboard>>[number];

// ─── Contenido ───

function groupStats<K extends string>(posts: PlatformPost[], keyOf: (p: PlatformPost) => K) {
  const groups = new Map<K, PlatformPost[]>();
  for (const p of posts) groups.set(keyOf(p), [...(groups.get(keyOf(p)) ?? []), p]);
  return Array.from(groups.entries())
    .map(([key, list]) => ({
      key,
      posts: list.length,
      creators: new Set(list.map((p) => p.creatorId)).size,
      medianEr: median(list.map((p) => p.er)) ?? 0,
      medianViews: median(list.map((p) => p.views ?? 0)) ?? 0,
    }))
    .sort((a, b) => b.medianEr - a.medianEr);
}

export async function contentAnalytics(niche?: string) {
  const tz = appTimeZone();
  const all = await allPosts();
  const posts = niche ? all.filter((p) => p.niche.id === niche) : all;

  const cells = HEATMAP_DAYS.map(() => HEATMAP_SLOTS.map(() => [] as number[]));
  for (const p of posts) {
    if (!p.postedAt) continue;
    const { day, slot } = slotOf(p.postedAt, tz);
    if (day >= 0 && slot >= 0) cells[day][slot].push(p.er);
  }
  const heatmap = cells.map((row) => row.map((values) => (values.length ? { median: median(values)!, count: values.length } : null)));
  let best: { day: string; slot: string; median: number; count: number } | null = null;
  heatmap.forEach((row, d) =>
    row.forEach((cell, s) => {
      if (cell && cell.count >= 2 && (!best || cell.median > best.median)) best = { day: HEATMAP_DAYS[d], slot: HEATMAP_SLOTS[s].label, ...cell };
    })
  );

  return {
    total: posts.length,
    creators: new Set(posts.map((p) => p.creatorId)).size,
    medianEr: median(posts.map((p) => p.er)),
    medianViews: median(posts.map((p) => p.views ?? 0)),
    top: [...posts].sort((a, b) => b.er - a.er).slice(0, 15),
    byPlatform: groupStats(posts, (p) => p.platform),
    byType: groupStats(posts, (p) => (p.type === "photo" ? "Foto" : "Video")),
    byCollab: groupStats(posts, (p) => (p.brandId ? "Con marca" : "Orgánico")),
    heatmap,
    best: best as { day: string; slot: string; median: number; count: number } | null,
  };
}

// ─── Nichos ───

export async function nicheBenchmarks() {
  const [posts, creators, deals] = await Promise.all([
    allPosts(),
    prismaRoot.creator.findMany({ select: { id: true, hero: { select: { niche: true } } } }),
    prismaRoot.brand.findMany({ where: { dealValue: { gt: 0 } }, select: { creatorId: true, dealValue: true } }),
  ]);
  const nicheByCreator = new Map(creators.map((c) => [c.id, nicheOf(c.hero?.niche)]));
  const ids = new Set(Array.from(nicheByCreator.values()).map((n) => n.id));
  return Array.from(ids)
    .map((id) => {
      const label = Array.from(nicheByCreator.values()).find((n) => n.id === id)!.label;
      const mine = posts.filter((p) => p.niche.id === id);
      const nicheDeals = deals.filter((d) => nicheByCreator.get(d.creatorId)?.id === id).map((d) => d.dealValue ?? 0);
      const byType = groupStats(mine, (p) => (p.type === "photo" ? "Foto" : "Video"));
      const byPlatform = groupStats(mine, (p) => p.platform);
      return {
        id,
        label,
        creators: Array.from(nicheByCreator.values()).filter((n) => n.id === id).length,
        posts: mine.length,
        medianEr: median(mine.map((p) => p.er)),
        medianViews: median(mine.map((p) => p.views ?? 0)),
        bestPlatform: byPlatform[0]?.key ?? null,
        bestType: byType[0]?.key ?? null,
        deals: nicheDeals.length,
        medianDeal: median(nicheDeals),
        maxDeal: nicheDeals.length ? Math.max(...nicheDeals) : null,
      };
    })
    .sort((a, b) => b.creators - a.creators || b.posts - a.posts);
}

// ─── Ficha de una cuenta ───

export async function creatorPerformance(creatorId: string) {
  const all = await allPosts();
  const mine = all.filter((p) => p.creatorId === creatorId);
  const niche = mine[0]?.niche ?? null;
  const nichePosts = niche ? all.filter((p) => p.niche.id === niche.id && p.creatorId !== creatorId) : [];
  return {
    medianEr: median(mine.map((p) => p.er)),
    nicheMedianEr: median(nichePosts.map((p) => p.er)),
    platformMedianEr: median(all.map((p) => p.er)),
    posts: mine.length,
    top: [...mine].sort((a, b) => b.er - a.er).slice(0, 5),
  };
}
