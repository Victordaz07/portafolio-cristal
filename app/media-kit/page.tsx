import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/locale";
import { pick, type Locale } from "@/lib/i18n";
import { formatCompact } from "@/lib/metrics";
import { getThumbnailUrl } from "@/lib/oembed";
import type { Platform } from "@/lib/embeds";
import { followerGrowth } from "@/lib/reports";
import { sitePathPrefix } from "@/lib/tenant";
import { safeHref } from "@/lib/validators";
import { caseStudyHighlights, engagementSummary, followerSeal, MAX_CASE_STUDIES, totalFollowerSeal, type Seal } from "@/lib/verified";
import { publicReport, type ReportData } from "@/lib/campaign-report";

export const dynamic = "force-dynamic";

const COPY = {
  es: {
    title: "Media kit",
    audience: "Audiencia",
    followers: "seguidores",
    total: "Seguidores totales",
    engagement: "Engagement promedio",
    collabs: "Colaboraciones",
    top: "Contenido destacado",
    views: "vistas",
    brands: "Marcas con las que he trabajado",
    contact: "¿Colaboramos?",
    contactBtn: "Escríbeme",
    portfolio: "Ver portafolio completo",
    verified: "Datos verificados por Foliocrew",
    verifiedHelp: "Vienen directo de la cuenta conectada, no están escritos a mano.",
    today: "actualizado hoy",
    daysAgo: (n: number) => `actualizado hace ${n} ${n === 1 ? "día" : "días"}`,
    cases: "Casos de éxito",
    caseViews: "vistas",
    caseEngagement: "interacción",
    caseRatio: "veces su promedio",
    casePosts: "publicaciones",
    switchTo: "EN",
  },
  en: {
    title: "Media kit",
    audience: "Audience",
    followers: "followers",
    total: "Total followers",
    engagement: "Average engagement",
    collabs: "Collaborations",
    top: "Featured content",
    views: "views",
    brands: "Brands I've worked with",
    contact: "Let's work together",
    contactBtn: "Email me",
    portfolio: "See full portfolio",
    verified: "Data verified by Foliocrew",
    verifiedHelp: "Straight from the connected account, not typed by hand.",
    today: "updated today",
    daysAgo: (n: number) => `updated ${n} ${n === 1 ? "day" : "days"} ago`,
    cases: "Success stories",
    caseViews: "views",
    caseEngagement: "engagement",
    caseRatio: "× their average",
    casePosts: "posts",
    switchTo: "ES",
  },
} satisfies Record<Locale, Record<string, string | ((n: number) => string)>>;

const NETWORK_LABEL: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", facebook: "Facebook" };

export async function generateMetadata(): Promise<Metadata> {
  const hero = await prisma.hero.findFirst({ select: { name: true, niche: true } });
  return { title: `Media kit — ${hero?.name ?? "Creación de contenido"}`, description: hero?.niche ?? undefined };
}

/** Media kit público: el link que la creadora le manda a las marcas. Solo datos públicos. */
export default async function MediaKitPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const locale: Locale = lang === "en" || lang === "es" ? lang : await getLocale();
  const sitePrefix = await sitePathPrefix();
  const copy = COPY[locale] as typeof COPY.es;

  const [hero, stats, growth, cards, brands, settings, collabs, reports] = await Promise.all([
    prisma.hero.findFirst(),
    prisma.stat.findMany({ orderBy: { order: "asc" } }),
    followerGrowth(1),
    prisma.contentCard.findMany({ where: { showMetrics: true } }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { order: "asc" }, select: { id: true, name: true, logoUrl: true } }),
    prisma.siteSettings.findFirst({ select: { contactEmail: true, collabsEmail: true } }),
    prisma.brand.count({ where: { dealStatus: { in: ["active", "completed"] } } }),
    prisma.campaignReport.findMany({
      where: { inMediaKit: true, status: "sent" },
      orderBy: { sentAt: "desc" },
      take: MAX_CASE_STUDIES,
      select: { id: true, title: true, data: true, hidden: true, brand: { select: { name: true } } },
    }),
  ]);

  const engagement = engagementSummary(cards);
  const avgEngagement = engagement.value;
  const totalSeal = totalFollowerSeal(growth.byPlatform);
  const caseStudies = reports.map((r) => {
    const view = publicReport(r.data as unknown as ReportData, r.hidden);
    return { id: r.id, brand: r.brand.name, title: r.title, highlights: caseStudyHighlights({ brand: r.brand.name, title: r.title, totals: view.totals, comparison: view.comparison }) };
  });
  const sealText = (seal: Seal) => (seal.days === 0 ? copy.today : copy.daysAgo(seal.days));
  const SealBadge = ({ seal }: { seal: Seal | null }) =>
    seal ? (
      <span title={copy.verifiedHelp} className="mt-1 inline-flex items-center gap-1 rounded-full bg-lime/30 px-2 py-0.5 text-[10px] font-semibold text-ink">
        ✓ {copy.verified} · {sealText(seal)}
      </span>
    ) : null;
  const top = cards.filter((c) => c.views).sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 3);
  const thumbs = await Promise.all(
    top.map((c) => c.thumbnailUrl ?? c.photoUrl ?? (c.postUrl ? getThumbnailUrl(c.platform as Platform, c.postUrl) : null))
  );
  const email = settings?.collabsEmail || settings?.contactEmail;
  const headline = [
    { label: copy.total, value: growth.totalNow == null ? null : formatCompact(growth.totalNow), seal: totalSeal },
    { label: copy.engagement, value: avgEngagement == null ? null : `${avgEngagement}%`, seal: engagement.seal },
    { label: copy.collabs, value: collabs ? String(collabs) : null, seal: null as Seal | null },
  ].filter((k) => k.value);

  return (
    <div className="min-h-screen bg-cream px-sp-5 py-sp-7">
      <div className="mx-auto flex max-w-3xl flex-col gap-sp-6">
        <div className="flex items-center justify-between gap-sp-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{copy.title}</p>
          <Link href={`${sitePrefix}/media-kit?lang=${locale === "es" ? "en" : "es"}`} className="rounded-full border border-line px-sp-3 py-1 font-mono text-xs text-ink hover:border-coral">
            {copy.switchTo}
          </Link>
        </div>

        <header className="flex flex-col items-center gap-sp-4 text-center sm:flex-row sm:text-left">
          {hero?.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={hero.photoUrl} alt={hero.name} className="h-28 w-28 shrink-0 rounded-full object-cover ring-4 ring-white" />
          )}
          <div>
            <h1 className="font-fraunces text-4xl font-medium italic text-ink">{hero?.name}</h1>
            <p className="mt-sp-1 text-sm font-semibold text-coral">{hero ? pick(locale, hero.niche, hero.nicheEn) : ""}</p>
            {hero?.description && <p className="mt-sp-2 max-w-xl text-sm text-ink/70">{pick(locale, hero.description, hero.descriptionEn)}</p>}
          </div>
        </header>

        {headline.length > 0 && (
          <div className="grid grid-cols-3 gap-sp-3 rounded-[20px] bg-ink p-sp-5 text-center text-cream">
            {headline.map((k) => (
              <div key={k.label}>
                <p className="font-fraunces text-3xl font-semibold text-lime">{k.value}</p>
                <p className="text-[11px] text-cream/70">{k.label}</p>
                {k.seal && (
                  <span title={copy.verifiedHelp} className="mt-1 inline-block rounded-full bg-lime/20 px-2 py-0.5 text-[10px] font-semibold text-lime">
                    ✓ {copy.verified} · {sealText(k.seal)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {(growth.byPlatform.length > 0 || stats.length > 0) && (
          <section>
            <h2 className="mb-sp-3 font-bodoni text-2xl font-bold uppercase italic text-ink">{copy.audience}</h2>
            <div className="grid grid-cols-2 gap-sp-3 sm:grid-cols-4">
              {growth.byPlatform.map((p) => (
                <div key={p.platform} className="rounded-[16px] border border-line bg-white p-sp-4">
                  <p className="font-fraunces text-2xl font-semibold text-ink">{formatCompact(p.followers)}</p>
                  <p className="text-xs text-ink/60">
                    {NETWORK_LABEL[p.platform] ?? p.platform} · {copy.followers}
                  </p>
                  <SealBadge seal={followerSeal(p)} />
                </div>
              ))}
              {stats.map((s) => (
                <div key={s.id} className="rounded-[16px] border border-line bg-white p-sp-4">
                  <p className="font-fraunces text-2xl font-semibold text-ink">{s.value}</p>
                  <p className="text-xs text-ink/60">{pick(locale, s.label, s.labelEn)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {caseStudies.length > 0 && (
          <section>
            <h2 className="mb-sp-3 font-bodoni text-2xl font-bold uppercase italic text-ink">{copy.cases}</h2>
            <div className="grid gap-sp-3 sm:grid-cols-3">
              {caseStudies.map((c) => (
                <div key={c.id} className="rounded-[16px] border border-line bg-white p-sp-4">
                  <p className="text-sm font-semibold text-ink">{c.brand}</p>
                  <p className="text-xs text-ink/60">{c.title}</p>
                  <ul className="mt-sp-2 flex flex-col gap-1">
                    {c.highlights.map((h) => (
                      <li key={h.key} className="text-sm text-ink">
                        <span className="font-fraunces text-xl font-semibold text-coral">
                          {h.key === "views" ? formatCompact(h.value) : h.key === "engagement" ? `${h.value}%` : h.key === "ratio" ? `${h.value}×` : h.value}
                        </span>{" "}
                        <span className="text-xs text-ink/60">
                          {h.key === "views" ? copy.caseViews : h.key === "engagement" ? copy.caseEngagement : h.key === "ratio" ? copy.caseRatio : copy.casePosts}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {top.length > 0 && (
          <section>
            <h2 className="mb-sp-3 font-bodoni text-2xl font-bold uppercase italic text-ink">{copy.top}</h2>
            <div className="grid grid-cols-3 gap-sp-3">
              {top.map((card, i) => (
                <a key={card.id} href={safeHref(card.postUrl) ?? "#"} target="_blank" rel="noreferrer" className="group flex flex-col gap-1.5">
                  <span className={`relative block overflow-hidden rounded-[14px] bg-gradient-to-br from-cobalt to-cobalt-ink ${card.type === "video" ? "aspect-[9/16]" : "aspect-[4/5]"}`}>
                    {thumbs[i] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" decoding="async" src={thumbs[i]!} alt="" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" />
                    )}
                  </span>
                  <span className="line-clamp-2 text-[12px] font-semibold text-ink">{pick(locale, card.caption, card.captionEn)}</span>
                  <span className="text-[11px] font-semibold text-coral">
                    {formatCompact(card.views)} {copy.views}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {brands.length > 0 && (
          <section>
            <h2 className="mb-sp-3 font-bodoni text-2xl font-bold uppercase italic text-ink">{copy.brands}</h2>
            <div className="flex flex-wrap gap-sp-3">
              {brands.map((brand) => (
                <div key={brand.id} className="flex h-16 w-16 items-center justify-center rounded-[14px] border border-line bg-white p-sp-2" title={brand.name}>
                  {brand.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" decoding="async" src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-center text-[10px] font-semibold text-ink/60">{brand.name}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col items-center gap-sp-3 rounded-[20px] border border-line bg-white p-sp-6 text-center">
          <h2 className="font-fraunces text-2xl font-medium italic text-ink">{copy.contact}</h2>
          <div className="flex flex-wrap justify-center gap-sp-2">
            {email && (
              <a href={`mailto:${email}`} className="rounded-full bg-coral px-sp-5 py-2.5 text-sm font-bold text-white hover:bg-moss">
                {copy.contactBtn}
              </a>
            )}
            <Link href="/" className="rounded-full border border-line px-sp-5 py-2.5 text-sm font-semibold text-ink hover:border-coral">
              {copy.portfolio}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
