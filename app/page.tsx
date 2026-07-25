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
import TestimonialCard from "@/components/TestimonialCard";
import type { ContentCardProps } from "@/components/ContentCard";

export const dynamic = "force-dynamic";

const NAV_LINKS = [
  { href: "#about", label: "About me" },
  { href: "#contenido", label: "Contents" },
  { href: "#why", label: "Why me?" },
  { href: "#contacto", label: "Contact" },
];

export default async function HomePage() {
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
  ]);

  const feedThumbnails = await Promise.all(
    contentCards.map((card) => getThumbnailUrl(card.platform as Platform, card.postUrl))
  );

  const feedCards: ContentCardProps[] = contentCards.map((card, index) => ({
    type: card.type as ContentType,
    platform: card.platform as Platform,
    postUrl: card.postUrl,
    caption: card.caption,
    category: card.category,
    statPrimary: card.statPrimary,
    statSecondary: card.statSecondary,
    thumbnailUrl: feedThumbnails[index],
  }));

  const hablamosRows = (
    [
      settings?.contactEmail && {
        icon: <MailIcon className="h-4 w-4" />,
        label: "Correo",
        value: settings.contactEmail,
        href: `mailto:${settings.contactEmail}`,
      },
      settings?.whatsapp && {
        icon: <WhatsAppIcon className="h-4 w-4" />,
        label: "WhatsApp",
        value: settings.whatsapp,
        href: `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`,
      },
      settings?.collabsEmail && {
        icon: <SendIcon className="h-4 w-4" />,
        label: "Colaboraciones",
        value: settings.collabsEmail,
        href: `mailto:${settings.collabsEmail}`,
      },
      settings?.websiteUrl && {
        icon: <GlobeIcon className="h-4 w-4" />,
        label: "Sitio web",
        value: settings.websiteUrl.replace(/^https?:\/\//, ""),
        href: settings.websiteUrl,
      },
    ] as Array<ContactInfoRow | false | undefined>
  ).filter((row): row is ContactInfoRow => Boolean(row));

  const siguemeRows = (
    [
      settings?.instagramHandle && {
        icon: <InstagramIcon className="h-4 w-4" />,
        label: "Instagram",
        value: settings.instagramHandle,
        href: `https://instagram.com/${settings.instagramHandle.replace(/^@/, "")}`,
      },
      settings?.tiktokHandle && {
        icon: <TikTokIcon className="h-4 w-4" />,
        label: "TikTok",
        value: settings.tiktokHandle,
        href: `https://tiktok.com/@${settings.tiktokHandle.replace(/^@/, "")}`,
      },
      settings?.youtubeHandle && {
        icon: <YouTubeIcon className="h-4 w-4" />,
        label: "YouTube",
        value: settings.youtubeHandle,
        href: `https://youtube.com/${settings.youtubeHandle.replace(/^\//, "")}`,
      },
      settings?.facebookHandle && {
        icon: <FacebookIcon className="h-4 w-4" />,
        label: "Facebook",
        value: settings.facebookHandle,
        href: `https://facebook.com/${settings.facebookHandle.replace(/^\//, "")}`,
      },
      settings?.pinterestHandle && {
        icon: <PinterestIcon className="h-4 w-4" />,
        label: "Pinterest",
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
          <ul className="flex gap-sp-2 font-mono text-[10px] uppercase tracking-wide sm:gap-sp-5 sm:text-xs">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-lime transition">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section id="about" className="relative overflow-hidden bg-cream">
          {/* Mobile: foto vertical full-bleed arriba + tarjeta que se monta encima */}
          <div className="md:hidden">
            <div className="relative">
              <MobileHeroNav name={hero?.name?.split(" ")[0] ?? "Cristal"} links={NAV_LINKS} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero?.photoUrlMobile ?? "/images/hero-placeholder-mobile.png"}
                alt={hero?.name ?? "Crislia"}
                className="aspect-square w-full object-cover object-bottom"
              />
              <div className="relative -mt-10 rounded-t-3xl bg-cream px-sp-5 pb-sp-8 pt-sp-7 text-center">
                <span className="inline-flex items-center gap-sp-2 rounded-full border border-line px-sp-4 py-sp-2 font-mono text-[11px] uppercase tracking-widest text-ink/80">
                  <SparkleIcon className="h-3.5 w-3.5 text-lime" />
                  {hero?.badgeLabel ?? "UGC Creator • Brand Reviews"}
                </span>

                <h1 className="mt-sp-5 font-fraunces text-[clamp(2rem,8vw,2.6rem)] font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
                  {hero?.headlinePlain ?? "Reseñas que"} {hero?.headlineEmphasis ?? "inspiran"}{" "}
                  {hero?.headlineSuffix ?? "confianza."}
                </h1>

                <div className="mt-sp-4 flex items-center justify-center gap-sp-3">
                  <span className="h-px w-14 bg-lime/60" />
                  <SparkleIcon className="h-3 w-3 shrink-0 text-lime" />
                  <span className="h-px w-14 bg-lime/60" />
                </div>

                <p className="mt-sp-4 font-sans text-sm leading-relaxed text-ink/75">
                  {hero?.description ??
                    "Creo contenido UGC auténtico y reseñas honestas que conectan marcas con personas de verdad."}
                </p>

                <div className="mt-sp-6 flex gap-sp-3">
                  <a
                    href={hero?.ctaPrimaryHref ?? "#contenido"}
                    className="inline-flex flex-1 items-center justify-center gap-sp-2 rounded-full border border-cobalt px-sp-4 py-sp-3 text-sm font-medium text-cobalt hover:bg-cobalt hover:text-cream transition"
                  >
                    {hero?.ctaPrimaryLabel ?? "Ver portafolio"}
                    <ArrowRightIcon className="h-4 w-4" />
                  </a>
                  <a
                    href={hero?.ctaSecondaryHref ?? "#contacto"}
                    className="inline-flex flex-1 items-center justify-center gap-sp-2 rounded-full bg-cobalt px-sp-4 py-sp-3 text-sm font-medium text-cream hover:opacity-90 transition"
                  >
                    {hero?.ctaSecondaryLabel ?? "Trabajemos juntas"}
                    <SparkleIcon className="h-3.5 w-3.5" />
                  </a>
                </div>

                {stats.length > 0 && (
                  <div className="mt-sp-6 grid grid-cols-3 gap-sp-3">
                    {stats.map((stat) => (
                      <HeroStatCard key={stat.id} value={stat.value} label={stat.label} icon={stat.icon} />
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
                  {hero?.badgeLabel ?? "UGC Creator • Brand Reviews"}
                </span>

                <h1 className="mt-sp-5 font-fraunces text-[clamp(2.2rem,4.4vw,3.6rem)] font-semibold leading-[1.08] tracking-[-0.01em] text-ink">
                  {hero?.headlinePlain ?? "Reseñas que"}
                  <br />
                  <em className="font-fraunces not-italic text-lime">
                    {hero?.headlineEmphasis ?? "inspiran"}
                  </em>{" "}
                  {hero?.headlineSuffix ?? "confianza."}
                </h1>

                <div className="mt-sp-5 h-px w-40 bg-gradient-to-r from-lime to-transparent" />

                <p className="mt-sp-5 font-sans leading-relaxed text-ink/75">
                  {renderHighlightedText(
                    hero?.description ??
                      "Creo contenido UGC auténtico y reseñas honestas que conectan marcas con personas de verdad."
                  )}
                </p>

                <div className="mt-sp-6 flex flex-wrap gap-sp-4">
                  <a
                    href={hero?.ctaPrimaryHref ?? "#contenido"}
                    className="inline-flex items-center gap-sp-2 rounded-sm bg-cobalt px-sp-6 py-sp-3 font-medium text-cream hover:opacity-90 transition"
                  >
                    {hero?.ctaPrimaryLabel ?? "Ver portafolio"}
                    <ArrowRightIcon className="h-4 w-4" />
                  </a>
                  <a
                    href={hero?.ctaSecondaryHref ?? "#contacto"}
                    className="inline-flex items-center gap-sp-2 rounded-sm border border-cobalt px-sp-6 py-sp-3 font-medium text-cobalt hover:bg-cobalt hover:text-cream transition"
                  >
                    {hero?.ctaSecondaryLabel ?? "Trabajemos juntas"}
                    <ArrowRightIcon className="h-4 w-4" />
                  </a>
                </div>

                {stats.length > 0 && (
                  <div
                    id="media-kit"
                    className="mt-sp-8 grid grid-cols-2 gap-sp-5 border-t border-line pt-sp-6 sm:grid-cols-3"
                  >
                    {stats.map((stat) => (
                      <HeroStat key={stat.id} value={stat.value} label={stat.label} icon={stat.icon} />
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
        <section id="contenido" className="mx-auto max-w-content px-sp-5 py-sp-9">
          <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink mb-sp-6">
            Contenido
          </h2>
          <ContentFeed cards={feedCards} />
        </section>

        {/* BRANDS */}
        {brands.length > 0 && (
          <section id="marcas" className="pb-sp-3">
            <p className="mx-auto max-w-content px-sp-5 font-mono text-xs uppercase tracking-widest text-moss mb-sp-4">
              Marcas y colaboraciones
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
          <section className="mx-auto max-w-content px-sp-5 pt-sp-6 pb-sp-9">
            <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
              Reseñas recientes
            </p>
            <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
              Reseñas <span className="text-coral">destacadas</span>
            </h2>
            <p className="mt-sp-3 max-w-md text-ink/70">
              Contenido honesto, detallado y pensado para ayudarte a tomar mejores decisiones.
            </p>

            <div className="mt-sp-6 flex flex-col gap-sp-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  photoUrl={review.photoUrl}
                  category={review.category}
                  title={review.title}
                  description={review.description}
                  rating={review.rating}
                />
              ))}
            </div>
          </section>
        )}

        {/* SERVICES */}
        {services.length > 0 && (
          <section className="bg-white">
            <div className="mx-auto max-w-content px-sp-5 py-sp-9 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
                Lo que hago
              </p>
              <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
                Cómo trabajo <span className="text-coral">contigo</span>
              </h2>

              <div className="mt-sp-7 grid gap-sp-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    icon={service.icon}
                    title={service.title}
                    description={service.description}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TESTIMONIALS */}
        {testimonials.length > 0 && (
          <section className="mx-auto max-w-content px-sp-5 py-sp-9">
            <div className="text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
                Lo que dicen las marcas
              </p>
              <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink">
                Resultados que <span className="text-coral">hablan</span> por sí solos
              </h2>
            </div>

            <div className="mt-sp-7 grid gap-sp-5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
              {testimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  quote={testimonial.quote}
                  name={testimonial.name}
                  role={testimonial.role}
                  photoUrl={testimonial.photoUrl}
                />
              ))}
            </div>
          </section>
        )}

        {/* WHY ME */}
        <section id="why" className="bg-cobalt text-cream">
          <div className="mx-auto max-w-content px-sp-5 py-sp-9">
            <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] mb-sp-5">
              Why me?
            </h2>
            <p className="max-w-2xl text-cream/85 leading-relaxed whitespace-pre-line">
              {settings?.whyMeText ??
                "Creo contenido auténtico, cuidado en el detalle y con comunicación responsable en cada colaboración."}
            </p>
          </div>
        </section>

        {/* FAQ */}
        {faqItems.length > 0 && (
          <section className="mx-auto max-w-content px-sp-5 py-sp-9">
            <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink mb-sp-6">
              FAQ
            </h2>
            <FaqAccordion items={faqItems} />
          </section>
        )}

        {/* CONTACT / FOOTER */}
        <section id="contacto" className="bg-cream">
          <div className="mx-auto max-w-content px-sp-5 py-sp-9">
            <div className="mx-auto max-w-2xl text-center">
              <SparkleIcon className="mx-auto h-5 w-5 text-lime" />
              <h2 className="mt-sp-3 font-fraunces italic text-[clamp(2rem,5vw,2.8rem)] text-ink">
                Conéctate con {hero?.name?.split(" ")[0] ?? "Crislia"}
              </h2>
              <p className="mt-sp-3 text-ink/75 leading-relaxed whitespace-pre-line">
                {settings?.footerIntro ??
                  "Gracias por ser parte de este espacio. Me encanta compartir contigo lo que uso, me funciona y puede hacer tu vida más fácil y bonita."}
              </p>
            </div>

            <div className="mt-sp-8 grid gap-sp-8 md:grid-cols-[1fr,1fr] md:items-start">
              <ContactForm />

              <div>
                <div className="relative overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/contact-photo.webp"
                    alt={`${hero?.name ?? "Crislia"} preparando un envío para su comunidad`}
                    className="w-full"
                  />

                  <div className="absolute inset-x-sp-4 top-sp-5 flex flex-col gap-sp-4 sm:inset-x-sp-6">
                    <ContactInfoCard title="¿Hablamos?" rows={hablamosRows} />
                    <ContactInfoCard title="Sígueme" rows={siguemeRows} />
                  </div>
                </div>

                <div className="relative z-10 mx-sp-5 -mt-sp-7 flex flex-col items-center gap-sp-2 rounded-md border border-line bg-cream p-sp-5 text-center shadow-lg">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime/25 text-coral">
                    <HeartIcon className="h-4 w-4" />
                  </span>
                  <p className="font-fraunces italic text-lg text-ink">Tu apoyo significa todo</p>
                  <p className="max-w-md text-xs text-ink/70">
                    {settings?.supportMessage ??
                      "Cada like, comentario y compartida me ayuda a seguir creando contenido que te sirve. ¡Gracias, de corazón!"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
