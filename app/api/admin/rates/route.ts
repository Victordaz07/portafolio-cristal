import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { engagementRate } from "@/lib/metrics";
import { median } from "@/lib/platform-analytics";
import { insightForNiche } from "@/lib/insights";

export const dynamic = "force-dynamic";

const PLATFORMS = ["instagram", "tiktok", "youtube", "facebook"] as const;

/**
 * Datos para la calculadora "¿Cuánto cobro?": seguidores, vistas y engagement medianos de cada red
 * conectada (últimas 30 publicaciones) y, si la cuenta participa en la Inteligencia, los del nicho.
 */
export async function GET() {
  const { t } = await getT();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: t("Inicia sesión", "Please sign in") }, { status: 401 });

  const [accounts, hero, creator] = await Promise.all([
    prisma.socialAccount.findMany({ select: { platform: true, followers: true } }),
    prisma.hero.findFirst({ select: { niche: true } }),
    prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { shareInsights: true } }),
  ]);
  const platforms = await Promise.all(
    PLATFORMS.map(async (platform) => {
      const cards = await prisma.contentCard.findMany({
        where: { platform, views: { gt: 0 } },
        orderBy: { postedAt: "desc" },
        take: 30,
        select: { views: true, likes: true, comments: true, shares: true, saves: true },
      });
      const ers = cards.map(engagementRate).filter((er): er is number => er != null);
      return {
        platform,
        followers: accounts.find((a) => a.platform === platform)?.followers ?? null,
        medianViews: median(cards.map((c) => c.views ?? 0)),
        medianEr: median(ers),
        posts: cards.length,
      };
    })
  );

  // Los datos del nicho solo los ve quien participa (igual que en Reportes).
  const insight = creator?.shareInsights ? await insightForNiche(hero?.niche) : null;
  const nicheEr = insight
    ? Object.fromEntries(PLATFORMS.map((p) => [p, insight.stats.byPlatform.find((b) => b.key === p)?.medianEr ?? insight.stats.medianEr ?? null]))
    : null;
  const nicheDeal = insight?.isOwnNiche && insight.stats.deals >= 5 && insight.stats.medianDeal ? { median: insight.stats.medianDeal, deals: insight.stats.deals, niche: insight.niche } : null;

  return NextResponse.json({ platforms, nicheEr, nicheDeal, sharesInsights: Boolean(creator?.shareInsights) });
}
