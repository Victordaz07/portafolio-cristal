import type { Goal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TIMEZONE, localDateKey, streakDays, type GoalSource } from "@/lib/growth";

export function appTimeZone() {
  return process.env.APP_TIMEZONE || DEFAULT_TIMEZONE;
}

export function todayKey() {
  return localDateKey(new Date(), appTimeZone());
}

const FOLLOWER_SOURCES: Partial<Record<GoalSource, string>> = {
  instagram_followers: "instagram",
  tiktok_followers: "tiktok",
  youtube_followers: "youtube",
  facebook_followers: "facebook",
};

/** Calcula el valor actual de las metas automáticas (seguidores, publicaciones del mes). */
export async function resolveGoalValues(goals: Goal[]) {
  const needsAccounts = goals.some((g) => FOLLOWER_SOURCES[g.source as GoalSource]);
  const needsFeed = goals.some((g) => g.source === "feed_posts_month");

  const [accounts, monthPosts] = await Promise.all([
    needsAccounts ? prisma.socialAccount.findMany({ select: { platform: true, followers: true } }) : [],
    needsFeed ? countFeedPostsThisMonth() : 0,
  ]);

  return goals.map((goal) => {
    const platform = FOLLOWER_SOURCES[goal.source as GoalSource];
    if (platform) {
      const account = accounts.find((a) => a.platform === platform);
      return { ...goal, current: account?.followers ?? goal.current, autoMissing: !account };
    }
    if (goal.source === "feed_posts_month") return { ...goal, current: monthPosts, autoMissing: false };
    return { ...goal, autoMissing: false };
  });
}

async function countFeedPostsThisMonth() {
  const today = todayKey();
  // Primer día del mes local → instante UTC aproximado (suficiente para contar publicaciones).
  const monthStart = new Date(`${today.slice(0, 8)}01T00:00:00.000Z`);
  return prisma.contentCard.count({ where: { createdAt: { gte: monthStart } } });
}

/** Racha: días seguidos con una entrada de bitácora, una tarea completada, una publicación nueva en el Feed o una marcada como publicada. */
export async function getActivityStreak() {
  const tz = appTimeZone();
  const since = new Date(Date.now() - 400 * 86_400_000);
  const [logs, actions, cards, published] = await Promise.all([
    prisma.logEntry.findMany({ where: { createdAt: { gte: since } }, select: { date: true } }),
    prisma.actionItem.findMany({ where: { completedAt: { gte: since } }, select: { completedAt: true } }),
    prisma.contentCard.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.scheduledPost.findMany({ where: { publishedAt: { gte: since } }, select: { publishedAt: true } }),
  ]);
  const days = new Set<string>([
    ...logs.map((l) => l.date),
    ...actions.map((a) => localDateKey(a.completedAt!, tz)),
    ...cards.map((c) => localDateKey(c.createdAt, tz)),
    ...published.map((p) => localDateKey(p.publishedAt!, tz)),
  ]);
  return streakDays(days, todayKey());
}
