import type { Metadata } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/locale";
import { pick } from "@/lib/i18n";
import { sitePathPrefix } from "@/lib/tenant";
import { getThumbnailUrl } from "@/lib/oembed";
import type { Platform } from "@/lib/embeds";
import { decodePreview, designFromSettings, parseDesign } from "@/lib/design";
import SiteFrame from "@/components/site/SiteFrame";
import LocaleSwitch from "@/components/links/LocaleSwitch";
import { Avatar, HeroCard, LinkCard, SectionDivider, SocialRow, riseDelay } from "@/components/links/LinkInBio";
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PinterestIcon,
  PlayIcon,
  SendIcon,
  SparkleIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

// "Link en bio": la página corta para poner en la bio de Instagram y TikTok.
// Sale sola de los datos del panel (portada, contacto, Feed) más los enlaces propios (BioLink).

const COPY = {
  es: {
    portfolio: "Portafolio",
    seeWork: "Mira mi trabajo",
    collab: "Colaboremos",
    mediaKit: "Media kit con mis números",
    writeMe: "Escríbeme para colaborar",
    whatsapp: "Hablemos por WhatsApp",
    email: "Mándame un correo",
    myLinks: "Mis enlaces",
    recent: "Contenido reciente",
    madeWith: "Hecho con",
  },
  en: {
    portfolio: "Portfolio",
    seeWork: "See my work",
    collab: "Let's work together",
    mediaKit: "Media kit with my numbers",
    writeMe: "Write me to collaborate",
    whatsapp: "Chat on WhatsApp",
    email: "Send me an email",
    myLinks: "My links",
    recent: "Recent content",
    madeWith: "Made with",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const hero = await prisma.hero.findFirst({ select: { name: true, niche: true, description: true, updatedAt: true } });
  if (!hero) return {};
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const image = host ? `${proto}://${host}${await sitePathPrefix()}/api/og?v=${hero.updatedAt.getTime()}` : undefined;
  const title = `${hero.name} · ${hero.niche || "UGC"}`;
  return {
    title,
    description: hero.description || undefined,
    openGraph: { title, description: hero.description || undefined, ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}) },
  };
}

const handleUrl = (base: string, handle: string) => `${base}${handle.replace(/^[@/]/, "")}`;

export default async function LinksPage({ searchParams }: { searchParams: Promise<{ disenio?: string }> }) {
  const { disenio } = await searchParams;
  const locale = await getLocale();
  const copy = COPY[locale];
  const prefix = await sitePathPrefix();

  const [hero, settings, links, cards] = await Promise.all([
    prisma.hero.findFirst(),
    prisma.siteSettings.findFirst(),
    prisma.bioLink.findMany({ orderBy: { order: "asc" } }),
    prisma.contentCard.findMany({
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      take: 4,
      select: { id: true, platform: true, postUrl: true, photoUrl: true, thumbnailUrl: true, caption: true, captionEn: true, category: true, categoryEn: true },
    }),
  ]);
  const design = parseDesign(decodePreview(disenio), designFromSettings(settings));
  const thumbs = await Promise.all(
    cards.map((c) => c.thumbnailUrl ?? c.photoUrl ?? (c.postUrl ? getThumbnailUrl(c.platform as Platform, c.postUrl) : Promise.resolve(null)))
  );

  const name = hero?.name ?? "";
  const icon = "h-[18px] w-[18px]";
  const socials = [
    settings?.instagramHandle && { icon: <InstagramIcon className={icon} />, href: handleUrl("https://instagram.com/", settings.instagramHandle), label: "Instagram" },
    settings?.tiktokHandle && { icon: <TikTokIcon className={icon} />, href: handleUrl("https://tiktok.com/@", settings.tiktokHandle), label: "TikTok" },
    settings?.youtubeHandle && { icon: <YouTubeIcon className={icon} />, href: handleUrl("https://youtube.com/", settings.youtubeHandle), label: "YouTube" },
    settings?.facebookHandle && { icon: <FacebookIcon className={icon} />, href: handleUrl("https://facebook.com/", settings.facebookHandle), label: "Facebook" },
    settings?.pinterestHandle && { icon: <PinterestIcon className={icon} />, href: handleUrl("https://pinterest.com/", settings.pinterestHandle), label: "Pinterest" },
  ].filter((s): s is { icon: JSX.Element; href: string; label: string } => Boolean(s));

  const email = settings?.collabsEmail || settings?.contactEmail;
  const collabLinks = [
    { title: copy.mediaKit, href: `${prefix}/media-kit`, icon: <SparkleIcon className="h-5 w-5" />, external: false },
    { title: copy.writeMe, href: `${prefix}/#contacto`, icon: <SendIcon className="h-5 w-5" />, external: false },
    settings?.whatsapp && { title: copy.whatsapp, href: `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`, icon: <WhatsAppIcon className="h-5 w-5" />, external: true },
    email && { title: copy.email, href: `mailto:${email}`, icon: <MailIcon className="h-5 w-5" />, external: true },
  ].filter((l): l is { title: string; href: string; icon: JSX.Element; external: boolean } => Boolean(l));

  let i = 0; // orden de aparición para la entrada escalonada
  return (
    <SiteFrame design={design}>
      <main className="mx-auto flex min-h-screen max-w-[480px] flex-col px-sp-4 pb-sp-6 pt-sp-4">
        <div className="flex justify-end">
          <LocaleSwitch locale={locale} />
        </div>

        <header className="fc-rise flex flex-col items-center text-center" style={{ "--delay": "0ms" } as React.CSSProperties}>
          <Avatar src={hero?.photoUrl ?? null} alt={name} fallback={name.charAt(0) || "✦"} />
          <h1 className="mt-sp-3 font-fraunces text-[28px] font-semibold leading-tight text-ink">{name}</h1>
          {hero?.niche && <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-moss">{pick(locale, hero.niche, hero.nicheEn)}</p>}
          {hero?.description && <p className="mt-sp-2 line-clamp-3 max-w-sm text-sm leading-relaxed text-ink/70">{pick(locale, hero.description, hero.descriptionEn)}</p>}
          <div className="mt-sp-4">
            <SocialRow items={socials} />
          </div>
        </header>

        <div className="mt-sp-5 grid grid-cols-2 gap-sp-3">
          <div className="fc-rise col-span-2" style={{ "--delay": "120ms" } as React.CSSProperties}>
            <HeroCard eyebrow={copy.portfolio} title={copy.seeWork} bgSrc={hero?.photoUrl ?? null} href={prefix || "/"} />
          </div>

          <SectionDivider label={copy.collab} style={riseDelay(i++)} />
          {collabLinks.map((l) => (
            <LinkCard key={l.href} variant="row" title={l.title} href={l.href} icon={l.icon} external={l.external} delay={riseDelay(i++)} />
          ))}

          {links.length > 0 && <SectionDivider label={copy.myLinks} style={riseDelay(i++)} />}
          {links.map((l) => (
            <LinkCard
              key={l.id}
              variant={l.wide ? "row" : "card"}
              title={pick(locale, l.title, l.titleEn)}
              href={l.url}
              thumbSrc={l.imageUrl}
              icon={<SparkleIcon className="h-5 w-5" />}
              pill={l.pill}
              delay={riseDelay(i++)}
            />
          ))}

          {cards.length > 0 && <SectionDivider label={copy.recent} style={riseDelay(i++)} />}
          {cards.map((c, index) => (
            <LinkCard
              key={c.id}
              variant="card"
              title={pick(locale, c.caption, c.captionEn).slice(0, 90)}
              href={c.postUrl || `${prefix}/#contenido`}
              thumbSrc={thumbs[index]}
              icon={<PlayIcon className="h-8 w-8" />}
              pill={pick(locale, c.category, c.categoryEn) || null}
              delay={riseDelay(i++)}
            />
          ))}
        </div>

        <p className="mt-auto pt-sp-6 text-center text-xs text-ink/45">
          {copy.madeWith}{" "}
          <a href="https://foliocrew.pro" className="font-semibold text-ink/65 hover:text-coral">
            Foliocrew
          </a>
        </p>
      </main>
    </SiteFrame>
  );
}
