import { prisma } from "@/lib/prisma";
import type { Platform, ContentType } from "@/lib/embeds";
import HeroStat from "@/components/HeroStat";
import HeroStatCard from "@/components/HeroStatCard";
import MobileHeroNav from "@/components/MobileHeroNav";
import {
  SparkleIcon,
  ArrowRightIcon,
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
import LocaleToggle from "@/components/LocaleToggle";
import MotivationTrigger from "@/components/MotivationTrigger";
import CreatorCredit from "@/components/CreatorCredit";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const copy = t(locale);

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
    prisma.contentCard.findMany({ orderBy: { order: "asc" } }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.faqItem.findMany({ orderBy: { order: "asc" } }),
    prisma.siteSettings.findFirst(),
    prisma.review.findMany({ orderBy: { order: "asc" } }),
    prisma.service.findMany({ orderBy: { order: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { order: "asc" } }),
    prisma.package.findMany({ orderBy: { order: "asc" } }),
  ]);

  const feedThumbnails = await Promise.all(
    contentCards.map((card) => getThumbnailUrl(card.platform as Platform, card.postUrl))
  );

  const feedCards: ContentCardProps[] = contentCards.map((card, index) => ({
    type: card.type as ContentType,
    platform: card.platform as Platform,
    postUrl: card.postUrl,
    videoUrl: card.videoUrl,
    caption: pick(locale, card.caption, card.captionEn),
    category: pick(locale, card.category, card.categoryEn),
    statPrimary: pick(locale, card.statPrimary ?? "", card.statPrimaryEn) || null,
    statSecondary: pick(locale, card.statSecondary ?? "", card.statSecondaryEn) || null,
    thumbnailUrl: feedThumbnails[index],
  }));

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

  return (
    <>
      <nav className="sticky top-0 z-40 hidden bg-cobalt text-cream md:block">
        <div className="mx-auto flex max-w-content items-center justify-between gap-sp-3 px-sp-5 py-sp-4">
          <span className="w-[92px] shrink-0 truncate font-bodoni italic font-bold uppercase text-xs sm:w-auto sm:text-sm">
            {hero?.name ?? "Crislia"}
          </span>
          <div className="flex items-center gap-sp-5">
            <ul className="flex gap-sp-2 font-mono text-[10px] uppercase tracking-wide sm:gap-sp-5 sm:text-xs">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-lime transition">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <LocaleToggle
              locale={locale}
              className="rounded-full border border-cream/30 px-sp-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cream hover:border-lime hover:text-lime transition"
            />
          </div>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section id="about" className="relative overflow-hidden bg-cream">
          {/* Mobile: foto vertical full-bleed arriba + tarjeta que se monta encima */}
          <div className="md:hidden">
            <div className="relative">
              <MobileHeroNav
                name={hero?.name?.split(" ")[0] ?? "Cristal"}
                links={navLinks}
                locale={locale}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero?.photoUrlMobile ?? "/images/hero-placeholder-mobile.png"}
                alt={hero?.name ?? "Crislia"}
                className="aspect-square w-full object-cover object-bottom"
              />
              <div className="relative -mt-10 rounded-t-3xl bg-cream px-sp-5 pb-sp-3 pt-sp-7 text-center">
                <span className="inline-flex items-center gap-sp-2 rounded-full border border-line px-sp-4 py-sp-2 font-mono text-[11px] uppercase tracking-widest text-ink/80">
                  <SparkleIcon className="h-3.5 w-3.5 text-lime" />
                  {pick(locale, hero?.badgeLabel ?? copy.hero.badge, hero?.badgeLabelEn)}
                </span>

                <h1 className="mt-sp-5 font-fraunces text-[clamp(2rem,8vw,2.6rem)] font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
                  {pick(locale, hero?.headlinePlain ?? copy.hero.headlinePlain, hero?.headlinePlainEn)}{" "}
                  {pick(locale, hero?.headlineEmphasis ?? copy.hero.headlineEmphasis, hero?.headlineEmphasisEn)}{" "}
                  {pick(locale, hero?.headlineSuffix ?? copy.hero.headlineSuffix, hero?.headlineSuffixEn)}
                </h1>

                <MotivationTrigger
                  locale={locale}
                  ariaLabel="Decoración"
                  className="mt-sp-4 flex w-full items-center justify-center gap-sp-3"
                >
                  <span className="h-px w-14 bg-lime/60" />
                  <SparkleIcon className="h-3 w-3 shrink-0 text-lime" />
                  <span className="h-px w-14 bg-lime/60" />
                </MotivationTrigger>

                <p className="mt-sp-4 font-sans text-sm leading-relaxed text-ink/75">
                  {pick(locale, hero?.description ?? copy.hero.description, hero?.descriptionEn)}
                </p>

                <div className="mt-sp-6 flex gap-sp-3">
                  <a
                    href={hero?.ctaPrimaryHref ?? "#contenido"}
                    className="inline-flex flex-1 items-center justify-center gap-sp-2 rounded-full border border-cobalt px-sp-4 py-sp-3 text-sm font-medium text-cobalt hover:bg-cobalt hover:text-cream transition"
                  >
                    {pick(locale, hero?.ctaPrimaryLabel ?? copy.hero.ctaPrimary, hero?.ctaPrimaryLabelEn)}
                    <ArrowRightIcon className="h-4 w-4" />
                  </a>
                  <a
                    href={hero?.ctaSecondaryHref ?? "#contacto"}
                    className="inline-flex flex-1 items-center justify-center gap-sp-2 rounded-full bg-cobalt px-sp-4 py-sp-3 text-sm font-medium text-cream hover:opacity-90 transition"
                  >
                    {pick(locale, hero?.ctaSecondaryLabel ?? copy.hero.ctaSecondary, hero?.ctaSecondaryLabelEn)}
                    <SparkleIcon className="h-3.5 w-3.5" />
                  </a>
                </div>

                {stats.length > 0 && (
                  <div className="mt-sp-6 grid grid-cols-3 gap-sp-3">
                    {stats.map((stat) => (
                      <HeroStatCard
                        key={stat.id}
                        value={stat.value}
                        label={pick(locale, stat.label, stat.labelEn)}
                        icon={stat.icon}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: grid de 2 columnas — texto a la izquierda, foto en bleed a la derecha */}
          <div className="hidden md:grid md:grid-cols-2 md:items-stretch">
            <div className="flex items-center py-sp-9">
              <div className="mx-auto w-full max-w-xl px-sp-5 lg:pl-sp-8 lg:pr-sp-6">
                <span className="inline-flex items-center gap-sp-2 rounded-full border border-line px-sp-4 py-sp-2 font-mono text-[11px] uppercase tracking-widest text-ink/80">
                  <SparkleIcon className="h-3.5 w-3.5 text-lime" />
                  {pick(locale, hero?.badgeLabel ?? copy.hero.badge, hero?.badgeLabelEn)}
                </span>

                <h1 className="mt-sp-5 font-fraunces text-[clamp(2.2rem,4.4vw,3.6rem)] font-semibold leading-[1.08] tracking-[-0.01em] text-ink">
                  {pick(locale, hero?.headlinePlain ?? copy.hero.headlinePlain, hero?.headlinePlainEn)}
                  <br />
                  <em className="font-fraunces not-italic text-lime">
                    {pick(locale, hero?.headlineEmphasis ?? copy.hero.headlineEmphasis, hero?.headlineEmphasisEn)}
                  </em>{" "}
                  {pick(locale, hero?.headlineSuffix ?? copy.hero.headlineSuffix, hero?.headlineSuffixEn)}
                </h1>

                <MotivationTrigger
                  locale={locale}
                  ariaLabel="Decoración"
                  className="mt-sp-5 flex items-center gap-sp-3"
                >
                  <span className="h-px w-14 bg-lime/60" />
                  <SparkleIcon className="h-3 w-3 shrink-0 text-lime" />
                  <span className="h-px w-24 bg-gradient-to-r from-lime/60 to-transparent" />
                </MotivationTrigger>

                <p className="mt-sp-5 font-sans leading-relaxed text-ink/75">
                  {renderHighlightedText(
                    pick(locale, hero?.description ?? copy.hero.description, hero?.descriptionEn)
                  )}
                </p>

                <div className="mt-sp-6 flex flex-wrap gap-sp-3">
                  <a
                    href={hero?.ctaPrimaryHref ?? "#contenido"}
                    className="inline-flex items-center gap-sp-2 rounded-full border border-cobalt px-sp-6 py-sp-3 font-medium text-cobalt hover:bg-cobalt hover:text-cream transition"
                  >
                    {pick(locale, hero?.ctaPrimaryLabel ?? copy.hero.ctaPrimary, hero?.ctaPrimaryLabelEn)}
                    <ArrowRightIcon className="h-4 w-4" />
                  </a>
                  <a
                    href={hero?.ctaSecondaryHref ?? "#contacto"}
                    className="inline-flex items-center gap-sp-2 rounded-full bg-cobalt px-sp-6 py-sp-3 font-medium text-cream hover:opacity-90 transition"
                  >
                    {pick(locale, hero?.ctaSecondaryLabel ?? copy.hero.ctaSecondary, hero?.ctaSecondaryLabelEn)}
                    <SparkleIcon className="h-4 w-4" />
                  </a>
                </div>

                {stats.length > 0 && (
                  <div
                    id="media-kit"
                    className="mt-sp-8 grid grid-cols-2 gap-sp-5 border-t border-line pt-sp-6 sm:grid-cols-3"
                  >
                    {stats.map((stat) => (
                      <HeroStat
                        key={stat.id}
                        value={stat.value}
                        label={pick(locale, stat.label, stat.labelEn)}
                        icon={stat.icon}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative min-h-[560px] lg:min-h-[640px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero?.photoUrl ?? "/images/hero-placeholder.png"}
                alt={hero?.name ?? "Crislia"}
                className="absolute inset-0 h-full w-full object-cover object-right"
              />
            </div>
          </div>
        </section>

        {/* FEED */}
        <section id="contenido" className="mx-auto max-w-content px-sp-5 pt-sp-5 pb-sp-9">
          <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink mb-sp-6">
            {copy.contenido.heading}
          </h2>
          <ContentFeed cards={feedCards} locale={locale} />
        </section>

        {/* BRANDS */}
        {brands.length > 0 && (
          <section id="marcas" className="pb-sp-3">
            <p className="mx-auto max-w-content px-sp-5 font-mono text-xs uppercase tracking-widest text-moss mb-sp-4">
              {copy.marcas.eyebrow}
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brands-banner.png"
              alt={hero?.name ?? "Crislia"}
              className="aspect-[5/2] w-full object-cover object-top"
            />

            <div className="relative overflow-hidden bg-white py-sp-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent sm:w-32" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent sm:w-32" />

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

        {/* REVIEWS */}
        {reviews.length > 0 && (
          <section className="mx-auto max-w-content px-sp-5 pt-sp-6 pb-sp-3">
            <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
              {copy.resenas.eyebrow}
            </p>
            <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
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

        {/* SERVICES */}
        {services.length > 0 && (
          <section className="bg-white">
            <div className="mx-auto max-w-content px-sp-5 pt-sp-6 pb-sp-3 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
                {copy.servicios.eyebrow}
              </p>
              <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
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

        {/* PACKAGES */}
        {packages.length > 0 && (
          <section className="mx-auto max-w-content px-sp-5 pt-sp-6 pb-sp-3 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
              {copy.paquetes.eyebrow}
            </p>
            <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
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

        {/* TESTIMONIALS */}
        {testimonials.length > 0 && (
          <section className="mx-auto max-w-content px-sp-5 pt-sp-6 pb-sp-9">
            <div className="text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
                {copy.testimonios.eyebrow}
              </p>
              <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
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

        {/* WHY ME */}
        <section id="why" className="relative overflow-hidden bg-cobalt text-cream">
          <QuoteIcon className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 text-cream/[0.06]" />
          <div className="relative mx-auto max-w-content px-sp-5 py-sp-9">
            <p className="font-mono text-xs uppercase tracking-widest text-lime mb-sp-2">
              {copy.whyMe.eyebrow}
            </p>
            <h2 className="max-w-2xl font-bodoni italic font-bold uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] mb-sp-5">
              {copy.whyMe.headingPlain}
              <span className="text-lime">{copy.whyMe.headingEmphasis}</span>
            </h2>
            <p className="max-w-2xl text-lg text-cream/85 leading-relaxed whitespace-pre-line">
              {pick(locale, settings?.whyMeText ?? copy.whyMe.fallback, settings?.whyMeTextEn)}
            </p>
          </div>
        </section>

        {/* FAQ */}
        {faqItems.length > 0 && (
          <section className="mx-auto max-w-content px-sp-5 pt-sp-9 pb-sp-3">
            <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
              {copy.faq.eyebrow}
            </p>
            <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink mb-sp-2">
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

        {/* CONTACT / FOOTER */}
        <section id="contacto" className="bg-cream">
          <div className="mx-auto max-w-content px-sp-5 pt-sp-6 pb-sp-9">
            <div className="mx-auto max-w-2xl text-center">
              <SparkleIcon className="mx-auto h-5 w-5 text-lime" />
              <h2 className="mt-sp-3 font-fraunces italic text-[clamp(2rem,5vw,2.8rem)] text-ink">
                {copy.contacto.headingPrefix}
                {hero?.name?.split(" ")[0] ?? "Crislia"}
              </h2>
              <p className="mt-sp-3 text-ink/75 leading-relaxed whitespace-pre-line">
                {pick(locale, settings?.footerIntro ?? copy.contacto.footerFallback, settings?.footerIntroEn)}
              </p>
            </div>

            <div className="mt-sp-8 grid gap-sp-8 md:grid-cols-[1fr,1fr] md:items-start">
              <ContactForm locale={locale} />

              <div>
                <div className="relative overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/contact-photo.webp"
                    alt={copy.contacto.photoAlt(hero?.name ?? "Crislia")}
                    className="w-full"
                  />

                  <div className="absolute inset-x-sp-4 top-sp-5 flex flex-col gap-sp-4 sm:inset-x-sp-6">
                    <ContactInfoCard title={copy.contacto.hablamos} rows={hablamosRows} />
                    <ContactInfoCard title={copy.contacto.sigueme} rows={siguemeRows} />
                  </div>
                </div>

                <div className="relative z-10 mx-sp-5 -mt-sp-7 flex flex-col items-center gap-sp-2 rounded-md border border-line bg-cream p-sp-5 text-center shadow-lg">
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
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
            © {new Date().getFullYear()} {hero?.name ?? "Crislia"}
          </p>
          <CreatorCredit locale={locale} />
        </div>
      </footer>
    </>
  );
}
