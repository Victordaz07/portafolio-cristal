import type { Metadata } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/locale";
import { pick } from "@/lib/i18n";
import { sitePathPrefix } from "@/lib/tenant";
import { getThumbnailUrl } from "@/lib/oembed";
import type { Platform } from "@/lib/embeds";
import { decodePreview, designFromSettings, parseDesign } from "@/lib/design";
import { POPULAR_MIN_CLICKS, groupLinks, iconKindForUrl } from "@/lib/bio-links";
import SiteFrame from "@/components/site/SiteFrame";
import LocaleSwitch from "@/components/links/LocaleSwitch";
import CopyLinkButton from "@/components/links/CopyLinkButton";
import ClickTracker from "@/components/links/ClickTracker";
import {
  Avatar,
  DisplayName,
  HeroCard,
  KindIcon,
  LinkTile,
  LinksBackground,
  SectionDivider,
  SocialRow,
  delay,
  riseDelay,
  type LinkItem,
} from "@/components/links/LinkInBio";
import { FacebookIcon, InstagramIcon, MailIcon, PinterestIcon, PlayIcon, SendIcon, SparkleIcon, TikTokIcon, WhatsAppIcon, YouTubeIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

// "Link en bio" (diseño "Crislia Links"): la página corta para la bio de Instagram y TikTok.
// Grupos con los enlaces propios (BioLink) + bloques automáticos (para marcas, contenido reciente) que se pueden apagar.

const COPY = {
  es: {
    tagline: "Mis favoritos y más ✨",
    copy: "Copiar mi enlace",
    copied: "¡Copiado!",
    portfolio: "Portafolio",
    featured: "Mi portafolio completo",
    myLinks: "Mis enlaces",
    popular: "Más clics",
    brandKit: "Trabaja conmigo",
    mediaKit: "Media kit con mis números",
    writeMe: "Escríbeme para colaborar",
    whatsapp: "Hablemos por WhatsApp",
    email: "Mándame un correo",
    recent: "Contenido reciente",
    madeWith: "Hecho con ♥ en",
  },
  en: {
    tagline: "Links to my faves & more ✨",
    copy: "Copy my link",
    copied: "Copied!",
    portfolio: "Portfolio",
    featured: "My full portfolio",
    myLinks: "My links",
    popular: "Most clicked",
    brandKit: "Work with me",
    mediaKit: "Media kit with my numbers",
    writeMe: "Write me to collaborate",
    whatsapp: "Chat on WhatsApp",
    email: "Send me an email",
    recent: "Recent content",
    madeWith: "Made with ♥ on",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const [hero, settings] = await Promise.all([
    prisma.hero.findFirst({ select: { name: true, niche: true, description: true, updatedAt: true } }),
    prisma.siteSettings.findFirst({ select: { linksTagline: true } }),
  ]);
  if (!hero) return {};
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const image = host ? `${proto}://${host}${await sitePathPrefix()}/api/og?v=${hero.updatedAt.getTime()}` : undefined;
  const title = `${hero.name} · ${hero.niche || "UGC"}`;
  const description = settings?.linksTagline || hero.description || undefined;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile", ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}) },
  };
}

const handleUrl = (base: string, handle: string) => `${base}${handle.replace(/^[@/]/, "")}`;

export default async function LinksPage({ searchParams }: { searchParams: Promise<{ disenio?: string }> }) {
  const { disenio } = await searchParams;
  const locale = await getLocale();
  const copy = COPY[locale];
  const prefix = await sitePathPrefix();

  const [hero, settings, links] = await Promise.all([
    prisma.hero.findFirst(),
    prisma.siteSettings.findFirst(),
    prisma.bioLink.findMany({ orderBy: { order: "asc" } }),
  ]);
  const showRecent = settings?.linksShowRecent ?? true;
  const cards = showRecent
    ? await prisma.contentCard.findMany({
        orderBy: [{ featured: "desc" }, { order: "asc" }],
        take: 4,
        select: { id: true, platform: true, postUrl: true, photoUrl: true, thumbnailUrl: true, caption: true, captionEn: true, category: true, categoryEn: true },
      })
    : [];
  const thumbs = await Promise.all(
    cards.map((c) => c.thumbnailUrl ?? c.photoUrl ?? (c.postUrl ? getThumbnailUrl(c.platform as Platform, c.postUrl) : Promise.resolve(null)))
  );
  const design = parseDesign(decodePreview(disenio), designFromSettings(settings));

  const name = hero?.name ?? "";
  const icon = "h-4 w-4 sm:h-[17px] sm:w-[17px]";
  const socials = [
    settings?.tiktokHandle && { icon: <TikTokIcon className={icon} />, href: handleUrl("https://tiktok.com/@", settings.tiktokHandle), label: "TikTok" },
    settings?.instagramHandle && { icon: <InstagramIcon className={icon} />, href: handleUrl("https://instagram.com/", settings.instagramHandle), label: "Instagram" },
    settings?.youtubeHandle && { icon: <YouTubeIcon className={icon} />, href: handleUrl("https://youtube.com/", settings.youtubeHandle), label: "YouTube" },
    settings?.facebookHandle && { icon: <FacebookIcon className={icon} />, href: handleUrl("https://facebook.com/", settings.facebookHandle), label: "Facebook" },
    settings?.pinterestHandle && { icon: <PinterestIcon className={icon} />, href: handleUrl("https://pinterest.com/", settings.pinterestHandle), label: "Pinterest" },
    (settings?.collabsEmail || settings?.contactEmail) && { icon: <MailIcon className={icon} />, href: `mailto:${settings?.collabsEmail || settings?.contactEmail}`, label: "Email" },
  ].filter((s): s is { icon: JSX.Element; href: string; label: string } => Boolean(s));

  // "Más clics": el enlace propio más visitado, si ya tiene suficientes clics para que signifique algo.
  const top = links.reduce<(typeof links)[number] | null>((best, l) => (l.clicks >= POPULAR_MIN_CLICKS && (!best || l.clicks > best.clicks) ? l : best), null);

  const groups: { title: string; items: LinkItem[] }[] = groupLinks(links, locale, copy.myLinks).map((g) => ({
    title: g.title,
    items: g.items.map((l) => ({
      key: l.id,
      id: l.id,
      variant: l.wide ? "row" : "card",
      title: pick(locale, l.title, l.titleEn),
      href: l.url,
      thumbSrc: l.imageUrl,
      icon: <KindIcon kind={iconKindForUrl(l.url)} large={!l.wide} />,
      pill: l.pill,
      kicker: l.kicker ? pick(locale, l.kicker, l.kickerEn) : null,
      badge: l.badge ? pick(locale, l.badge, l.badgeEn) : l.id === top?.id ? copy.popular : null,
    })),
  }));

  if (settings?.linksShowBrandKit ?? true) {
    const email = settings?.collabsEmail || settings?.contactEmail;
    groups.push({
      title: copy.brandKit,
      items: [
        { key: "media-kit", variant: "row", title: copy.mediaKit, href: `${prefix}/media-kit`, external: false, icon: <SparkleIcon className="h-4 w-4" /> },
        { key: "contacto", variant: "row", title: copy.writeMe, href: `${prefix}/#contacto`, external: false, icon: <SendIcon className="h-4 w-4" /> },
        ...(settings?.whatsapp
          ? [{ key: "wa", variant: "row" as const, title: copy.whatsapp, href: `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`, icon: <WhatsAppIcon className="h-4 w-4" /> }]
          : []),
        ...(email ? [{ key: "mail", variant: "row" as const, title: copy.email, href: `mailto:${email}`, icon: <MailIcon className="h-4 w-4" /> }] : []),
      ],
    });
  }
  if (cards.length) {
    groups.push({
      title: copy.recent,
      items: cards.map((c, index) => ({
        key: c.id,
        variant: "card",
        title: pick(locale, c.caption, c.captionEn).slice(0, 90),
        href: c.postUrl || `${prefix}/#contenido`,
        thumbSrc: thumbs[index],
        icon: <PlayIcon className="h-6 w-6" />,
        kicker: pick(locale, c.category, c.categoryEn) || null,
      })),
    });
  }

  const tagline = settings?.linksTagline ? pick(locale, settings.linksTagline, settings.linksTaglineEn) : copy.tagline;
  let i = 0; // orden de aparición para la entrada escalonada

  return (
    <SiteFrame design={{ ...design, background: "liso" }}>
      <LinksBackground pattern={design.pattern} />
      <ClickTracker endpoint={`${prefix}/api/links/click`} />
      <main className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center px-[18px] pb-9 pt-5 sm:px-6 sm:pb-14 sm:pt-10">
        <div className="mb-2 flex w-full justify-end">
          <LocaleSwitch locale={locale} />
        </div>

        <div className="fc-rise mb-3 sm:mb-[14px]" style={delay(0)}>
          <Avatar src={hero?.photoUrl ?? null} alt={name} fallback={name.charAt(0) || "✦"} />
        </div>
        <div className="fc-rise mb-[3px]" style={delay(60)}>
          <DisplayName name={name} />
        </div>
        <p className="fc-rise mb-[10px] text-center text-[12.5px] text-cobalt/60 sm:text-[13.5px]" style={delay(110)}>
          {tagline}
        </p>
        <div className="fc-rise mb-[10px] sm:mb-3" style={delay(135)}>
          <CopyLinkButton label={copy.copy} done={copy.copied} />
        </div>
        <div className="fc-rise mb-4 sm:mb-[18px]" style={delay(160)}>
          <SocialRow items={socials} />
        </div>

        <div className="fc-rise mb-[22px] w-full sm:mb-6" style={delay(220)}>
          <HeroCard eyebrow={copy.portfolio} title={copy.featured} bgSrc={hero?.photoUrl ?? null} href={prefix || "/"} />
        </div>

        {groups.map((group) => (
          <section key={group.title} className="mb-[18px] w-full sm:mb-5">
            <SectionDivider label={group.title} />
            <div className="grid grid-cols-2 gap-[9px] sm:gap-[10px]">
              {group.items.map((item) => (
                <LinkTile key={item.key} item={item} style={riseDelay(++i)} />
              ))}
            </div>
          </section>
        ))}

        <p className="mt-1.5 text-[11px] text-cobalt/45 sm:mt-2">
          {copy.madeWith}{" "}
          <a href="https://foliocrew.pro" className="font-semibold text-cobalt/65 hover:text-coral">
            Foliocrew
          </a>
        </p>
      </main>
    </SiteFrame>
  );
}
