import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/locale";
import { pick, type Locale } from "@/lib/i18n";
import { sitePathPrefix } from "@/lib/tenant";
import { PRODUCT_KINDS, buttonLabel, formatPrice, needsAffiliateNotice, relFor } from "@/lib/shop";
import ClickTracker from "@/components/links/ClickTracker";

export const dynamic = "force-dynamic";

const COPY = {
  es: {
    title: "Tienda",
    empty: "Todavía no hay nada a la venta.",
    affiliate: "Enlace de afiliado",
    notice: "Algunos enlaces son de afiliados: si compras por ellos puedo ganar una comisión, sin costo extra para ti. Solo recomiendo lo que uso o creo que te servirá.",
    secure: "El pago lo procesa directamente el vendedor en su propio enlace de pago.",
    back: "Volver al sitio",
    switchTo: "EN",
  },
  en: {
    title: "Shop",
    empty: "Nothing for sale yet.",
    affiliate: "Affiliate link",
    notice: "Some links are affiliate links: if you buy through them I may earn a commission at no extra cost to you. I only recommend what I use or think will help you.",
    secure: "Payment is processed directly by the seller on their own payment link.",
    back: "Back to the site",
    switchTo: "ES",
  },
} satisfies Record<Locale, Record<string, string>>;

export async function generateMetadata(): Promise<Metadata> {
  const hero = await prisma.hero.findFirst({ select: { name: true } });
  return { title: `Tienda — ${hero?.name ?? ""}`.trim() };
}

/** Tienda pública: productos digitales, asesorías y recomendaciones. El pago se hace en el enlace de la propia creadora (0 % de comisión de Foliocrew). */
export default async function ShopPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const locale: Locale = lang === "en" || lang === "es" ? lang : await getLocale();
  const copy = COPY[locale];
  const prefix = await sitePathPrefix();
  const [hero, products] = await Promise.all([
    prisma.hero.findFirst({ select: { name: true } }),
    prisma.product.findMany({ where: { active: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
  ]);

  return (
    <div className="min-h-screen bg-cream px-sp-5 py-sp-7">
      <ClickTracker endpoint={`${prefix}/api/shop/click`} />
      <div className="mx-auto flex max-w-3xl flex-col gap-sp-6">
        <div className="flex items-center justify-between gap-sp-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{copy.title}</p>
          <Link href={`${prefix}/tienda?lang=${locale === "es" ? "en" : "es"}`} className="rounded-full border border-line px-sp-3 py-1 font-mono text-xs text-ink hover:border-coral">
            {copy.switchTo}
          </Link>
        </div>
        <h1 className="font-fraunces text-4xl font-medium italic text-ink">{hero?.name}</h1>

        {products.length === 0 ? (
          <p className="text-ink/60">{copy.empty}</p>
        ) : (
          <ul className="grid gap-sp-4 sm:grid-cols-2">
            {products.map((p) => {
              const price = formatPrice(p.priceCents, p.currency, locale);
              const kind = PRODUCT_KINDS.find((k) => k.id === p.kind);
              return (
                <li key={p.id} className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" decoding="async" src={p.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                  )}
                  <div className="flex flex-1 flex-col gap-sp-2 p-sp-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-coral">{p.kind === "affiliate" ? copy.affiliate : locale === "en" ? kind?.labelEn : kind?.label}</p>
                    <h2 className="font-fraunces text-xl font-medium text-ink">{pick(locale, p.title, p.titleEn)}</h2>
                    {p.description && <p className="text-sm text-ink/70">{pick(locale, p.description, p.descriptionEn)}</p>}
                    <div className="mt-auto flex items-center justify-between gap-sp-3 pt-sp-3">
                      <span className="font-fraunces text-lg font-semibold text-ink">{price ?? ""}</span>
                      <a
                        href={p.buyUrl}
                        target="_blank"
                        rel={relFor(p.kind)}
                        data-link-id={p.id}
                        className="rounded-full bg-coral px-sp-5 py-2.5 text-sm font-bold text-white hover:bg-moss"
                      >
                        {buttonLabel(p.kind, locale)}
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {needsAffiliateNotice(products) && (
          <p role="note" className="rounded-[14px] border border-line bg-white px-sp-4 py-sp-3 text-xs text-ink/70">
            {copy.notice}
          </p>
        )}
        <p className="text-xs text-ink/45">{copy.secure}</p>
        <Link href={prefix || "/"} className="text-sm font-semibold text-coral hover:underline">
          ← {copy.back}
        </Link>
      </div>
    </div>
  );
}
