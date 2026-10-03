import { Fragment } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { currentCreator, defaultCreatorSlug, sitePathPrefix } from "@/lib/tenant";
import type { Platform, ContentType } from "@/lib/embeds";
import SiteHero from "@/components/site/SiteHero";
import SiteFrame from "@/components/site/SiteFrame";
import { decodePreview, designFromSettings, parseDesign, STYLES, type SectionId, type StyleDef } from "@/lib/design";
import {
  SparkleIcon,
  HeartIcon,
  MailIcon,
  SendIcon,
  GlobeIcon,
  WhatsAppIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
  FacebookIcon,
  PinterestIcon,
  QuoteIcon,
} from "@/components/icons";
import { renderHighlightedText } from "@/lib/highlight";
import { getThumbnailUrl } from "@/lib/oembed";
import ContentFeed from "@/components/ContentFeed";
import CollaborationsSection, { type CollaborationBrand } from "@/components/CollaborationsSection";
import BrandCard from "@/components/BrandCard";
import FaqAccordion from "@/components/FaqAccordion";
import ContactForm from "@/components/ContactForm";
import ContactInfoCard, { type ContactInfoRow } from "@/components/ContactInfoCard";
import ReviewCard from "@/components/ReviewCard";
import ServiceCard from "@/components/ServiceCard";
import PackageCard from "@/components/PackageCard";
import TestimonialCard from "@/components/TestimonialCard";
import type { ContentCardProps } from "@/components/ContentCard";
import { getLocale } from "@/lib/locale";
import { t, pick, pickArray } from "@/lib/i18n";
import MotivationTrigger from "@/components/MotivationTrigger";
import CreatorCredit from "@/components/CreatorCredit";

export const dynamic = "force-dynamic";

/** Foto de reemplazo mientras la creadora no sube la suya (nunca la de otra creadora). */
const PHOTO_PLACEHOLDER = "/images/placeholder-creadora.svg";

export async function generateMetadata(): Promise<Metadata> {
  const hero = await prisma.hero.findFirst({ select: { name: true, niche: true, description: true, updatedAt: true } });
  if (!hero) return {};
  const title = `${hero.name} — ${hero.niche || "Contenido UGC"}`;
  const description = hero.description || `Portafolio de ${hero.name}: contenido UGC, media kit y colaboraciones.`;
  // Imagen para compartir con los colores del Estudio de diseño (app/api/og).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const image = host ? `${proto}://${host}${await sitePathPrefix()}/api/og?v=${hero.updatedAt.getTime()}` : undefined;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile", ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
  };
}

/** Pie para las creadoras de Foliocrew (el sitio de Cristal mantiene su crédito propio). */
function MadeWithFoliocrew() {
  return (
    <p className="py-sp-4 text-center text-xs text-ink/50">
      Hecho con{" "}
      <a href="https://foliocrew.pro" className="font-semibold text-ink/70 hover:text-coral">
        Foliocrew
      </a>
    </p>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ disenio?: string }> }) {
  const { disenio } = await searchParams;
  const locale = await getLocale();
  const copy = t(locale);
  // El sitio de Cristal (la creadora original) conserva el crédito de su diseñador.
  const isFlagship = (await currentCreator()).slug === defaultCreatorSlug();
  const sitePrefix = await sitePathPrefix();

  const navLinks = [
    { href: "#about", label: copy.nav.about },
    { href: "#contenido", label: copy.nav.contenido },
    { href: "#why", label: copy.nav.why },
    { href: "#contacto", label: copy.nav.contacto },
  ];

  const [
    hero,
    stats,
    contentCards,
    brands,
    faqItems,
    settings,
    reviews,
    services,
    testimonials,
    packages,
  ] = await Promise.all([
    prisma.hero.findFirst(),
    prisma.stat.findMany({ orderBy: { order: "asc" } }),
    prisma.contentCard.findMany({
      orderBy: { order: "asc" },
      include: { brand: { select: { id: true, name: true, logoUrl: true, websiteUrl: true, active: true } } },
    }),
    // Solo columnas públicas: la marca también guarda datos privados del CRM.
    prisma.brand.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, logoUrl: true, websiteUrl: true },
    }),
    prisma.faqItem.findMany({ orderBy: { order: "asc" } }),
    prisma.siteSettings.findFirst(),
    prisma.review.findMany({ orderBy: { order: "asc" } }),
    prisma.service.findMany({ orderBy: { order: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { order: "asc" } }),
    prisma.package.findMany({ orderBy: { order: "asc" } }),
  ]);

  const feedThumbnails = await Promise.all(
    contentCards.map((card) => {
      if (card.thumbnailUrl) return Promise.resolve(card.thumbnailUrl);
      if (card.photoUrl) return Promise.resolve(card.photoUrl);
      if (card.postUrl) return getThumbnailUrl(card.platform as Platform, card.postUrl);
      return Promise.resolve(null);
    })
  );

  // Diseño guardado o, desde el Estudio de diseño, una vista previa sin guardar (?disenio=…).
  const design = parseDesign(decodePreview(disenio), designFromSettings(settings));
  const style: StyleDef = STYLES[design.style];
  const description = pick(locale, hero?.description ?? copy.hero.description, hero?.descriptionEn);

  const firstName = hero?.name?.split(" ")[0] ?? "";
  const handles: Record<string, string | null | undefined> = {
    instagram: settings?.instagramHandle,
    tiktok: settings?.tiktokHandle,
    facebook: settings?.facebookHandle,
  };

  const feedCards: ContentCardProps[] = contentCards.map((card, index) => ({
    type: card.type as ContentType,
    platform: card.platform as Platform,
    postUrl: card.postUrl ?? "",
    videoUrl: card.videoUrl,
    photoUrl: card.photoUrl,
    caption: pick(locale, card.caption, card.captionEn),
    category: pick(locale, card.category, card.categoryEn),
    statPrimary: pick(locale, card.statPrimary ?? "", card.statPrimaryEn) || null,
    statSecondary: pick(locale, card.statSecondary ?? "", card.statSecondaryEn) || null,
    thumbnailUrl: feedThumbnails[index],
    brandName: card.brand?.name ?? null,
    brandLogoUrl: card.brand?.logoUrl ?? null,
    metrics: card.showMetrics
      ? { views: card.views, likes: card.likes, comments: card.comments, shares: card.shares, saves: card.saves }
      : null,
    topComment: card.topComment ? pick(locale, card.topComment, card.topCommentEn) : null,
    topCommentAuthor: card.topCommentAuthor,
    handle: handles[card.platform] ?? null,
    displayName: firstName,
  }));

  // Colaboraciones: por marca, hasta 3 piezas; primero las destacadas y, si no hay, las primeras del Feed.
  const collaborations: CollaborationBrand[] = [];
  const byFeatured = contentCards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => Number(b.card.featured) - Number(a.card.featured));
  byFeatured.forEach(({ card, index }) => {
    if (!card.brand || !card.brand.active) return;
    let entry = collaborations.find((c) => c.name === card.brand!.name);
    if (!entry) {
      entry = { name: card.brand.name, logoUrl: card.brand.logoUrl, websiteUrl: card.brand.websiteUrl, pieces: [] };
      collaborations.push(entry);
    }
    if (entry.pieces.length >= 3) return;
    entry.pieces.push({
      type: card.type as ContentType,
      platform: card.platform as Platform,
      postUrl: card.postUrl ?? "",
      videoUrl: card.videoUrl,
      photoUrl: card.photoUrl,
      thumbnailUrl: feedThumbnails[index],
      caption: pick(locale, card.caption, card.captionEn),
      category: pick(locale, card.category, card.categoryEn),
      views: card.showMetrics ? card.views : null,
    });
  });

  const hablamosRows = (
    [
      settings?.contactEmail && {
        icon: <MailIcon className="h-4 w-4" />,
        label: copy.connect.correo,
        value: settings.contactEmail,
        href: `mailto:${settings.contactEmail}`,
      },
      settings?.whatsapp && {
        icon: <WhatsAppIcon className="h-4 w-4" />,
        label: copy.connect.whatsapp,
        value: settings.whatsapp,
        href: `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`,
      },
      settings?.collabsEmail && {
        icon: <SendIcon className="h-4 w-4" />,
        label: copy.connect.colaboraciones,
        value: settings.collabsEmail,
        href: `mailto:${settings.collabsEmail}`,
      },
      settings?.websiteUrl && {
        icon: <GlobeIcon className="h-4 w-4" />,
        label: copy.connect.sitioWeb,
        value: settings.websiteUrl.replace(/^https?:\/\//, ""),
        href: settings.websiteUrl,
      },
    ] as Array<ContactInfoRow | false | undefined>
  ).filter((row): row is ContactInfoRow => Boolean(row));

  const siguemeRows = (
    [
      settings?.instagramHandle && {
        icon: <InstagramIcon className="h-4 w-4" />,
        label: copy.connect.instagram,
        value: settings.instagramHandle,
        href: `https://instagram.com/${settings.instagramHandle.replace(/^@/, "")}`,
      },
      settings?.tiktokHandle && {
        icon: <TikTokIcon className="h-4 w-4" />,
        label: copy.connect.tiktok,
        value: settings.tiktokHandle,
        href: `https://tiktok.com/@${settings.tiktokHandle.replace(/^@/, "")}`,
      },
      settings?.youtubeHandle && {
        icon: <YouTubeIcon className="h-4 w-4" />,
        label: copy.connect.youtube,
        value: settings.youtubeHandle,
        href: `https://youtube.com/${settings.youtubeHandle.replace(/^\//, "")}`,
      },
      settings?.facebookHandle && {
        icon: <FacebookIcon className="h-4 w-4" />,
        label: copy.connect.facebook,
        value: settings.facebookHandle,
        href: `https://facebook.com/${settings.facebookHandle.replace(/^\//, "")}`,
      },
      settings?.pinterestHandle && {
        icon: <PinterestIcon className="h-4 w-4" />,
        label: copy.connect.pinterest,
        value: settings.pinterestHandle,
        href: `https://pinterest.com/${settings.pinterestHandle.replace(/^\//, "")}`,
      },
    ] as Array<ContactInfoRow | false | undefined>
  ).filter((row): row is ContactInfoRow => Boolean(row));

  // Secciones que se pueden ordenar u ocultar en el Estudio de diseño.
  const sectionContent: Record<SectionId, React.ReactNode> = {
    contenido: (
      <Fragment key="contenido">
          <section id="contenido" className="mx-auto max-w-content px-sp-5 pt-sp-5 pb-sp-9">
            <h2 className="site-heading text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink mb-sp-6">
              {copy.contenido.heading}
            </h2>
            <ContentFeed cards={feedCards} locale={locale} />
          </section>
      </Fragment>
    ),
    colaboraciones: (
      <Fragment key="colaboraciones">
          {collaborations.length > 0 && (
            <section id="colaboraciones" className="mx-auto max-w-content px-sp-5 pb-sp-9">
              <CollaborationsSection brands={collaborations} locale={locale} />
            </section>
          )}
      </Fragment>
    ),
    marcas: (
      <Fragment key="marcas">
          {brands.length > 0 && (
            <section id="marcas" className="pb-sp-3">
              <p className="mx-auto max-w-content px-sp-5 font-mono text-xs uppercase tracking-widest text-moss mb-sp-4">
                {copy.marcas.eyebrow}
              </p>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/brands-banner.png"
                alt={hero?.name ?? ""}
                className="aspect-[5/2] w-full object-cover object-top"
              />

              <div className="relative overflow-hidden bg-surface py-sp-4">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-surface to-transparent sm:w-32" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-surface to-transparent sm:w-32" />

                <div className="flex w-max animate-marquee gap-sp-4 px-sp-4">
                  {[...brands, ...brands].map((brand, index) => (
                    <BrandCard
                      key={`${brand.id}-${index}`}
                      name={brand.name}
                      logoUrl={brand.logoUrl}
                      websiteUrl={brand.websiteUrl}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
      </Fragment>
    ),
    resenas: (
      <Fragment key="resenas">
          {reviews.length > 0 && (
            <section className="mx-auto max-w-content px-sp-5 pt-sp-6 pb-sp-3">
              <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
                {copy.resenas.eyebrow}
              </p>
              <h2 className="site-heading text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
                {copy.resenas.headingPlain}
                <span className="text-coral">{copy.resenas.headingEmphasis}</span>
              </h2>
              <p className="mt-sp-3 max-w-md text-ink/70">{copy.resenas.intro}</p>

              <div className="mt-sp-6 flex flex-col gap-sp-4">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    photoUrl={review.photoUrl}
                    category={pick(locale, review.category, review.categoryEn)}
                    title={pick(locale, review.title, review.titleEn)}
                    description={pick(locale, review.description, review.descriptionEn)}
                    rating={review.rating}
                  />
                ))}
              </div>
            </section>
          )}
      </Fragment>
    ),
    servicios: (
      <Fragment key="servicios">
          {services.length > 0 && (
            <section className="bg-surface">
              <div className="mx-auto max-w-content px-sp-5 pt-sp-6 pb-sp-3 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
                  {copy.servicios.eyebrow}
                </p>
                <h2 className="site-heading text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
                  {copy.servicios.headingPlain}
                  <span className="text-coral">{copy.servicios.headingEmphasis}</span>
                </h2>

                <div className="mt-sp-7 grid gap-sp-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      icon={service.icon}
                      title={pick(locale, service.title, service.titleEn)}
                      description={pick(locale, service.description, service.descriptionEn)}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
      </Fragment>
    ),
    paquetes: (
      <Fragment key="paquetes">
          {packages.length > 0 && (
            <section className="mx-auto max-w-content px-sp-5 pt-sp-6 pb-sp-3 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
                {copy.paquetes.eyebrow}
              </p>
              <h2 className="site-heading text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
                {copy.paquetes.headingPlain}
                <span className="text-coral">{copy.paquetes.headingEmphasis}</span>
              </h2>
              <p className="mt-sp-3 mx-auto max-w-md text-ink/70">{copy.paquetes.intro}</p>

              <div className="mt-sp-7 grid gap-sp-5 text-left [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    emoji={pkg.emoji}
                    name={pick(locale, pkg.name, pkg.nameEn)}
                    items={pickArray(locale, pkg.items, pkg.itemsEn)}
                  />
                ))}
              </div>
            </section>
          )}
      </Fragment>
    ),
    testimonios: (
      <Fragment key="testimonios">
          {testimonials.length > 0 && (
            <section className="mx-auto max-w-content px-sp-5 pt-sp-6 pb-sp-9">
              <div className="text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
                  {copy.testimonios.eyebrow}
                </p>
                <h2 className="site-heading text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
                  {copy.testimonios.headingPlain}
                  <span className="text-coral">{copy.testimonios.headingEmphasis}</span>
                  {copy.testimonios.headingSuffix}
                </h2>
              </div>

              <div className="mt-sp-7 grid gap-sp-5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
                {testimonials.map((testimonial) => (
                  <TestimonialCard
                    key={testimonial.id}
                    quote={pick(locale, testimonial.quote, testimonial.quoteEn)}
                    name={testimonial.name}
                    role={pick(locale, testimonial.role, testimonial.roleEn)}
                    photoUrl={testimonial.photoUrl}
                  />
                ))}
              </div>
            </section>
          )}
      </Fragment>
    ),
    why: (
      <Fragment key="why">
          <section
              id="why"
              className="relative overflow-hidden bg-cobalt text-cream"
              // En estilos oscuros este bloque es claro: el acento claro no se leería, se usa el oscuro.
              style={style.dark ? ({ "--accent-light": "var(--accent-deep)" } as React.CSSProperties) : undefined}
            >
            <QuoteIcon className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 text-cream/[0.06]" />
            <div className="relative mx-auto max-w-content px-sp-5 py-sp-9">
              <p className="font-mono text-xs uppercase tracking-widest text-lime mb-sp-2">
                {copy.whyMe.eyebrow}
              </p>
              <h2 className="max-w-2xl site-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] mb-sp-5">
                {copy.whyMe.headingPlain}
                <span className="text-lime">{copy.whyMe.headingEmphasis}</span>
              </h2>
              <p className="max-w-2xl text-lg text-cream/85 leading-relaxed whitespace-pre-line">
                {pick(locale, settings?.whyMeText ?? copy.whyMe.fallback, settings?.whyMeTextEn)}
              </p>
            </div>
          </section>
      </Fragment>
    ),
    faq: (
      <Fragment key="faq">
          {faqItems.length > 0 && (
            <section className="mx-auto max-w-content px-sp-5 pt-sp-9 pb-sp-3">
              <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
                {copy.faq.eyebrow}
              </p>
              <h2 className="site-heading text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink mb-sp-2">
                {copy.faq.headingPlain}
                <span className="text-coral">{copy.faq.headingEmphasis}</span>
              </h2>
              <p className="max-w-md text-ink/70 mb-sp-6">{copy.faq.intro}</p>
              <FaqAccordion
                items={faqItems.map((item) => ({
                  id: item.id,
                  question: pick(locale, item.question, item.questionEn),
                  answer: pick(locale, item.answer, item.answerEn),
                }))}
              />
            </section>
          )}
      </Fragment>
    ),
  };

  return (
    <SiteFrame design={design}>
      <main>
        <SiteHero
          layout={design.hero}
          locale={locale}
          name={hero?.name ?? ""}
          firstName={firstName}
          navLinks={navLinks}
          badge={pick(locale, hero?.badgeLabel ?? copy.hero.badge, hero?.badgeLabelEn)}
          headline={{
            plain: pick(locale, hero?.headlinePlain ?? copy.hero.headlinePlain, hero?.headlinePlainEn),
            emphasis: pick(locale, hero?.headlineEmphasis ?? copy.hero.headlineEmphasis, hero?.headlineEmphasisEn),
            suffix: pick(locale, hero?.headlineSuffix ?? copy.hero.headlineSuffix, hero?.headlineSuffixEn),
          }}
          description={description}
          descriptionNode={renderHighlightedText(description)}
          primary={{ label: pick(locale, hero?.ctaPrimaryLabel ?? copy.hero.ctaPrimary, hero?.ctaPrimaryLabelEn), href: hero?.ctaPrimaryHref ?? "#contenido" }}
          secondary={{
            label: pick(locale, hero?.ctaSecondaryLabel ?? copy.hero.ctaSecondary, hero?.ctaSecondaryLabelEn),
            href: hero?.ctaSecondaryHref ?? "#contacto",
          }}
          photo={hero?.photoUrl ?? PHOTO_PLACEHOLDER}
          photoMobile={hero?.photoUrlMobile ?? hero?.photoUrl ?? PHOTO_PLACEHOLDER}
          stats={stats.map((stat) => ({ id: stat.id, value: stat.value, label: pick(locale, stat.label, stat.labelEn), icon: stat.icon }))}
        />

        {design.sections.filter((section) => !section.hidden).map((section) => sectionContent[section.id])}

        {/* CONTACT / FOOTER */}
        <section id="contacto" className="bg-cream">
          <div className="mx-auto max-w-content px-sp-5 pt-sp-6 pb-sp-9">
            <div className="mx-auto max-w-2xl text-center">
              <SparkleIcon className="mx-auto h-5 w-5 text-lime" />
              <h2 className="mt-sp-3 font-fraunces italic text-[clamp(2rem,5vw,2.8rem)] text-ink">
                {copy.contacto.headingPrefix}
                {firstName}
              </h2>
              <p className="mt-sp-3 text-ink/75 leading-relaxed whitespace-pre-line">
                {pick(locale, settings?.footerIntro ?? copy.contacto.footerFallback, settings?.footerIntroEn)}
              </p>
            </div>

            <div className="mt-sp-8 grid gap-sp-8 md:grid-cols-[1fr,1fr] md:items-start">
              <ContactForm locale={locale} endpoint={`${sitePrefix}/api/contact`} />

              <div>
                <div className="r-md relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/contact-photo.webp"
                    alt={copy.contacto.photoAlt(hero?.name ?? "")}
                    className="w-full"
                  />

                  <div className="absolute inset-x-sp-4 top-sp-5 flex flex-col gap-sp-4 sm:inset-x-sp-6">
                    <ContactInfoCard title={copy.contacto.hablamos} rows={hablamosRows} />
                    <ContactInfoCard title={copy.contacto.sigueme} rows={siguemeRows} />
                  </div>
                </div>

                <div className="relative z-10 mx-sp-5 -mt-sp-7 flex flex-col items-center gap-sp-2 r-sm border border-line bg-cream p-sp-5 text-center shadow-lg">
                  <MotivationTrigger
                    locale={locale}
                    ariaLabel="Decoración"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-lime/25 text-coral"
                  >
                    <HeartIcon className="h-4 w-4" />
                  </MotivationTrigger>
                  <p className="font-fraunces italic text-lg text-ink">{copy.contacto.apoyoTitle}</p>
                  <p className="max-w-md text-xs text-ink/70">
                    {pick(locale, settings?.supportMessage ?? copy.contacto.apoyoFallback, settings?.supportMessageEn)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-cream px-sp-5 py-sp-5">
        <div className="mx-auto flex max-w-content items-center justify-between gap-sp-3">
          <div className="flex flex-wrap items-center gap-x-sp-3 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-ink/40">
            <p>
              © {new Date().getFullYear()} {hero?.name ?? ""}
            </p>
            <Link href="/privacidad" className="hover:text-coral">
              {locale === "en" ? "Privacy" : "Privacidad"}
            </Link>
            <Link href="/terminos" className="hover:text-coral">
              {locale === "en" ? "Terms" : "Términos"}
            </Link>
          </div>
          {isFlagship ? <CreatorCredit locale={locale} /> : <MadeWithFoliocrew />}
        </div>
      </footer>
    </SiteFrame>
  );
}
