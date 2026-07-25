import { prisma } from "@/lib/prisma";
import type { Platform, ContentType } from "@/lib/embeds";
import HeroStat from "@/components/HeroStat";
import HeroStatCard from "@/components/HeroStatCard";
import { SparkleIcon, ArrowRightIcon } from "@/components/icons";
import { renderHighlightedText } from "@/lib/highlight";
import ContentFeed from "@/components/ContentFeed";
import BrandCard from "@/components/BrandCard";
import PricingCard from "@/components/PricingCard";
import FaqAccordion from "@/components/FaqAccordion";
import ContactForm from "@/components/ContactForm";
import { PackageSelectionProvider } from "@/components/PackageSelectionContext";
import type { ContentCardProps } from "@/components/ContentCard";

export const dynamic = "force-dynamic";

const NAV_LINKS = [
  { href: "#about", label: "About me" },
  { href: "#contenido", label: "Contents" },
  { href: "#why", label: "Why me?" },
  { href: "#contacto", label: "Contact" },
];

export default async function HomePage() {
  const [hero, stats, contentCards, brands, pricingPackages, faqItems, settings] =
    await Promise.all([
      prisma.hero.findFirst(),
      prisma.stat.findMany({ orderBy: { order: "asc" } }),
      prisma.contentCard.findMany({ orderBy: { order: "asc" } }),
      prisma.brand.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
      prisma.pricingPackage.findMany({ orderBy: { order: "asc" } }),
      prisma.faqItem.findMany({ orderBy: { order: "asc" } }),
      prisma.siteSettings.findFirst(),
    ]);

  const feedCards: ContentCardProps[] = contentCards.map((card) => ({
    type: card.type as ContentType,
    platform: card.platform as Platform,
    postUrl: card.postUrl,
    caption: card.caption,
    category: card.category,
    statPrimary: card.statPrimary,
    statSecondary: card.statSecondary,
  }));

  return (
    <PackageSelectionProvider>
      <nav className="sticky top-0 z-40 bg-cobalt text-cream">
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero?.photoUrlMobile ?? "/images/hero-placeholder-mobile.png"}
                alt={hero?.name ?? "Crislia"}
                className="aspect-[3/4] w-full object-cover object-top"
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

          {/* Desktop: foto en bleed a la derecha + columna de texto a la izquierda */}
          <div className="hidden md:block">
            <div className="absolute inset-y-0 right-0 w-[46%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero?.photoUrl ?? "/images/hero-placeholder.png"}
                alt={hero?.name ?? "Crislia"}
                className="h-full w-full object-cover object-right"
              />
            </div>

            <div className="relative mx-auto max-w-content px-sp-5 py-sp-9">
              <div className="max-w-xl md:pr-sp-6">
                <span className="inline-flex items-center gap-sp-2 rounded-full border border-line px-sp-4 py-sp-2 font-mono text-[11px] uppercase tracking-widest text-ink/80">
                  <SparkleIcon className="h-3.5 w-3.5 text-lime" />
                  {hero?.badgeLabel ?? "UGC Creator • Brand Reviews"}
                </span>

                <h1 className="mt-sp-5 font-fraunces text-[clamp(2.6rem,6vw,4.8rem)] font-semibold leading-[1.08] tracking-[-0.01em] text-ink">
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
          <section id="marcas" className="pb-sp-9">
            <p className="mx-auto max-w-content px-sp-5 font-mono text-xs uppercase tracking-widest text-moss mb-sp-4">
              Marcas y colaboraciones
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brands-banner.png"
              alt={hero?.name ?? "Crislia"}
              className="aspect-[7/2] w-full object-cover object-top"
            />

            <div className="relative overflow-hidden bg-white py-sp-6">
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

        {/* PRICING */}
        <section className="mx-auto max-w-content px-sp-5 py-sp-9">
          <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink mb-sp-6">
            Paquetes
          </h2>
          <div className="grid gap-sp-5 md:grid-cols-3">
            {pricingPackages.map((pkg) => (
              <PricingCard
                key={pkg.id}
                name={pkg.name}
                price={pkg.price}
                unit={pkg.unit}
                deliverables={pkg.deliverables}
                featured={pkg.featured}
              />
            ))}
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

        {/* CONTACT */}
        <section id="contacto" className="mx-auto max-w-content px-sp-5 py-sp-9">
          <h2 className="font-bodoni italic font-bold uppercase text-[clamp(1.8rem,3.4vw,2.6rem)] text-ink mb-sp-6">
            Contacto
          </h2>
          <div className="grid gap-sp-8 md:grid-cols-[1fr,1fr]">
            <ContactForm />
            <div className="flex flex-col gap-sp-3 font-mono text-sm text-moss">
              {settings?.instagramHandle && <p>Instagram: {settings.instagramHandle}</p>}
              {settings?.tiktokHandle && <p>TikTok: {settings.tiktokHandle}</p>}
              {settings?.contactEmail && <p>Email: {settings.contactEmail}</p>}
            </div>
          </div>
        </section>
      </main>
    </PackageSelectionProvider>
  );
}
