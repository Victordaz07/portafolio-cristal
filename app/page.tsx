import { prisma } from "@/lib/prisma";
import type { Platform, ContentType } from "@/lib/embeds";
import StatCard from "@/components/StatCard";
import ContentFeed from "@/components/ContentFeed";
import BrandChip from "@/components/BrandChip";
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
      prisma.brand.findMany({ orderBy: { order: "asc" } }),
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
        <section id="about" className="mx-auto max-w-content px-sp-5 py-sp-9">
          <div className="grid gap-sp-8 md:grid-cols-[1.2fr,0.8fr] md:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-moss">
                {hero?.location ?? "Santo Domingo, DR"} · {hero?.niche ?? "UGC"}
              </p>
              <h1 className="mt-sp-3 font-fraunces text-[clamp(2.8rem,6.4vw,5.6rem)] font-semibold leading-[1.06] tracking-[-0.01em] text-ink">
                {hero?.headlinePlain ?? "Contenido real,"}{" "}
                <em className="font-fraunces italic text-coral">
                  {hero?.headlineEmphasis ?? "filmado a mano."}
                </em>
              </h1>
              <div className="mt-sp-6 flex flex-wrap gap-sp-4">
                <a
                  href={hero?.ctaPrimaryHref ?? "#contacto"}
                  className="rounded-sm bg-coral px-sp-6 py-sp-3 font-medium text-white hover:opacity-90 transition"
                >
                  {hero?.ctaPrimaryLabel ?? "Trabajemos juntos"}
                </a>
                <a
                  href={hero?.ctaSecondaryHref ?? "#media-kit"}
                  className="rounded-sm border border-cobalt px-sp-6 py-sp-3 font-medium text-cobalt hover:bg-cobalt hover:text-cream transition"
                >
                  {hero?.ctaSecondaryLabel ?? "Ver media kit"}
                </a>
              </div>
            </div>

            {hero?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero.photoUrl}
                alt={hero.name}
                className="aspect-[4/5] w-full rounded-lg object-cover"
              />
            ) : (
              <div className="aspect-[4/5] w-full rounded-lg bg-gradient-to-br from-cobalt to-cobalt-ink" />
            )}
          </div>
        </section>

        {/* MEDIA KIT */}
        <section id="media-kit" className="mx-auto max-w-content px-sp-5 pb-sp-9">
          <div className="grid gap-sp-4 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
            {stats.map((stat) => (
              <StatCard key={stat.id} value={stat.value} label={stat.label} />
            ))}
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
          <section className="mx-auto max-w-content px-sp-5 pb-sp-9">
            <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-4">
              Brands that trust on me
            </p>
            <div className="flex flex-wrap gap-sp-3">
              {brands.map((brand) => (
                <BrandChip key={brand.id} name={brand.name} logoUrl={brand.logoUrl} />
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
