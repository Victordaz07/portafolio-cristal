import { prisma } from "@/lib/prisma";
import { currentCreatorId } from "@/lib/tenant";
import { appTimeZone, todayKey } from "@/lib/growth-server";
import { addDays, localDateKey } from "@/lib/growth";
import { engagementRate } from "@/lib/metrics";

// ─── Historial de seguidores ───

/** Guarda (o actualiza) los seguidores de hoy para una red. */
export async function recordFollowerSnapshot(platform: string, followers: number | null, source: "auto" | "manual" = "auto", date?: string) {
  if (followers == null || followers < 0) return;
  const day = date ?? todayKey();
  await prisma.followerSnapshot.upsert({
    where: { creatorId_platform_date: { creatorId: await currentCreatorId(), platform, date: day } },
    create: { platform, date: day, followers, source },
    update: { followers, source },
  });
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

/** Último valor conocido de cada red en o antes de `day`. */
function latestPerPlatform(snapshots: { platform: string; date: string; followers: number }[], day: string) {
  const latest = new Map<string, { date: string; followers: number }>();
  for (const s of snapshots) {
    if (s.date > day) continue;
    const current = latest.get(s.platform);
    if (!current || s.date > current.date) latest.set(s.platform, s);
  }
  return latest;
}

/** Seguidores totales (suma de redes) al cierre de cada uno de los `months` meses que terminan en `endMonth`. */
export async function followerGrowth(months = 6, endMonth?: string) {
  const snapshots = await prisma.followerSnapshot.findMany({ select: { platform: true, date: true, followers: true } });
  const today = todayKey();
  const current = endMonth && endMonth < today.slice(0, 7) ? endMonth : today.slice(0, 7);
  const series = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const month = shiftMonth(current, -i);
    const monthEnd = month === today.slice(0, 7) ? today : addDays(`${shiftMonth(month, 1)}-01`, -1);
    const latest = latestPerPlatform(snapshots, monthEnd);
    const total = Array.from(latest.values()).reduce((sum, s) => sum + s.followers, 0);
    series.push({ month, label: monthLabel(month), total: latest.size ? total : null });
  }
  const now = latestPerPlatform(snapshots, today);
  const before = latestPerPlatform(snapshots, addDays(today, -30));
  const byPlatform = Array.from(now.entries()).map(([platform, s]) => ({ platform, followers: s.followers, date: s.date }));
  const totalNow = byPlatform.reduce((sum, p) => sum + p.followers, 0);
  // Crecimiento de 30 días solo con las redes que ya tenían dato hace 30 días.
  const comparable = byPlatform.filter((p) => before.has(p.platform));
  const delta30 = comparable.length
    ? comparable.reduce((sum, p) => sum + p.followers - before.get(p.platform)!.followers, 0)
    : null;
  return { series, byPlatform, totalNow: byPlatform.length ? totalNow : null, delta30 };
}

// ─── Mejor momento para publicar ───

export const HEATMAP_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const HEATMAP_SLOTS = [
  { label: "Mañana", hint: "6–12 h", from: 6, to: 12 },
  { label: "Mediodía", hint: "12–16 h", from: 12, to: 16 },
  { label: "Tarde", hint: "16–20 h", from: 16, to: 20 },
  { label: "Noche", hint: "20–6 h", from: 20, to: 30 },
];

function slotIndex(hour: number) {
  const h = hour < 6 ? hour + 24 : hour;
  return HEATMAP_SLOTS.findIndex((s) => h >= s.from && h < s.to);
}

/** Engagement promedio por día de la semana y franja, con las publicaciones que tienen fecha y métricas. */
export async function postingHeatmap() {
  const tz = appTimeZone();
  const cards = await prisma.contentCard.findMany({
    where: { postedAt: { not: null }, views: { gt: 0 } },
    select: { postedAt: true, views: true, likes: true, comments: true, shares: true, saves: true },
  });
  const cells = HEATMAP_DAYS.map(() => HEATMAP_SLOTS.map(() => ({ sum: 0, count: 0 })));
  for (const card of cards) {
    const rate = engagementRate(card);
    if (rate == null) continue;
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(card.postedAt!);
    const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.find((p) => p.type === "weekday")!.value);
    const slot = slotIndex(Number(parts.find((p) => p.type === "hour")!.value));
    if (weekday < 0 || slot < 0) continue;
    cells[weekday][slot].sum += rate;
    cells[weekday][slot].count += 1;
  }
  const grid = cells.map((row) => row.map((c) => (c.count ? { avg: Math.round((c.sum / c.count) * 10) / 10, count: c.count } : null)));
  let best: { day: string; slot: string; avg: number } | null = null;
  grid.forEach((row, d) =>
    row.forEach((cell, s) => {
      if (cell && (!best || cell.avg > best.avg)) best = { day: HEATMAP_DAYS[d], slot: HEATMAP_SLOTS[s].label, avg: cell.avg };
    })
  );
  return { grid, best: best as { day: string; slot: string; avg: number } | null, samples: cards.length };
}

// ─── Ingresos por marca (CRM) ───

export async function revenueByBrand() {
  const deals = await prisma.brand.findMany({
    where: { dealStatus: { not: null }, dealValue: { gt: 0 } },
    select: { name: true, dealValue: true, dealStatus: true, paymentStatus: true },
    orderBy: { dealValue: "desc" },
  });
  const rows = deals.map((d) => ({
    name: d.name,
    value: d.dealValue ?? 0,
    state: d.paymentStatus === "paid" ? "Cobrado" : d.paymentStatus === "pending" ? "Por cobrar" : d.dealStatus === "completed" || d.dealStatus === "active" ? "Por cobrar" : "En negociación",
  }));
  const sum = (state: string) => rows.filter((r) => r.state === state).reduce((total, r) => total + r.value, 0);
  return { rows, paid: sum("Cobrado"), pending: sum("Por cobrar"), negotiating: sum("En negociación") };
}

// ─── Engagement promedio y publicaciones del mes ───

export async function contentStats(month: string) {
  const tz = appTimeZone();
  const [cards, published] = await Promise.all([
    prisma.contentCard.findMany({
      select: { views: true, likes: true, comments: true, shares: true, saves: true, createdAt: true, postedAt: true },
    }),
    prisma.scheduledPost.findMany({ where: { publishedAt: { not: null } }, select: { publishedAt: true } }),
  ]);
  const rates = cards.map((c) => engagementRate(c)).filter((r): r is number => r != null);
  const avgEngagement = rates.length ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10 : null;
  const inMonth = (d: Date | null) => !!d && localDateKey(d, tz).startsWith(month);
  const postsThisMonth =
    published.filter((p) => inMonth(p.publishedAt)).length + cards.filter((c) => inMonth(c.postedAt ?? c.createdAt)).length;
  return { avgEngagement, postsThisMonth, cardsWithMetrics: rates.length };
}
