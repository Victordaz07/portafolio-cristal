import Link from "next/link";
import type { ReactNode } from "react";
import { getLocale } from "@/lib/locale";
import type { Locale } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";
import { getLegalPage, type LegalPageId } from "@/lib/legal-content";

const PATHS: Record<LegalPageId, string> = {
  privacy: "/privacidad",
  terms: "/terminos",
  deletion: "/eliminar-datos",
};

const NAV: Record<Locale, Record<LegalPageId, string> & { back: string; updated: string }> = {
  es: { privacy: "Privacidad", terms: "Términos", deletion: "Eliminación de datos", back: "Volver al sitio", updated: "Última actualización" },
  en: { privacy: "Privacy", terms: "Terms", deletion: "Data deletion", back: "Back to site", updated: "Last updated" },
};

/** Convierte URLs y correos dentro del texto en enlaces. */
function linkify(text: string): ReactNode[] {
  // Sin incluir el punto final de la oración dentro del enlace.
  return text.split(/(https?:\/\/[^\s),]*[^\s),.]|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g).map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer" className="break-all text-coral underline">
          {part}
        </a>
      );
    }
    if (/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/.test(part)) {
      return (
        <a key={i} href={`mailto:${part}`} className="text-coral underline">
          {part}
        </a>
      );
    }
    return part;
  });
}

/** Página legal pública. El idioma sale de ?lang=es|en (útil para los revisores de cada red) o de la cookie. */
export default async function LegalPageView({ id, lang, notice }: { id: LegalPageId; lang?: string; notice?: ReactNode }) {
  const locale: Locale = lang === "en" || lang === "es" ? lang : await getLocale();
  const page = getLegalPage(id, locale, {
    platformName: siteConfig.platformName,
    legalOwner: siteConfig.legalOwner,
    legalEmail: siteConfig.legalEmail,
    updatedAt: siteConfig.legalUpdatedAt,
  });
  const nav = NAV[locale];
  const otherLocale: Locale = locale === "es" ? "en" : "es";

  return (
    <div className="min-h-screen bg-cream px-sp-5 py-sp-7">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-sp-3">
          <Link href="/" className="font-bodoni text-lg font-bold uppercase italic text-ink">
            {siteConfig.platformName}
          </Link>
          <div className="flex items-center gap-sp-3 text-sm">
            <Link href="/" className="text-ink/60 hover:text-coral">
              ← {nav.back}
            </Link>
            <Link
              href={`${PATHS[id]}?lang=${otherLocale}`}
              className="rounded-full border border-line px-sp-3 py-1 font-mono text-xs uppercase text-ink hover:border-coral"
            >
              {otherLocale}
            </Link>
          </div>
        </div>

        <nav className="mt-sp-5 flex flex-wrap gap-sp-2">
          {(Object.keys(PATHS) as LegalPageId[]).map((pageId) => (
            <Link
              key={pageId}
              href={`${PATHS[pageId]}?lang=${locale}`}
              className={`rounded-full px-sp-3 py-1.5 text-xs font-semibold ${
                pageId === id ? "bg-ink text-cream" : "border border-line bg-white text-ink/70 hover:border-coral"
              }`}
            >
              {nav[pageId]}
            </Link>
          ))}
        </nav>

        {notice}

        <article className="mt-sp-6 rounded-[18px] border border-line bg-white p-sp-5 sm:p-sp-6">
          <h1 className="font-fraunces text-3xl font-medium italic text-ink sm:text-4xl">{page.title}</h1>
          <p className="mt-sp-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/50">
            {nav.updated}: {siteConfig.legalUpdatedAt}
          </p>
          <p className="mt-sp-4 leading-relaxed text-ink/80">{linkify(page.intro)}</p>
          {page.sections.map((section) => (
            <section key={section.heading} className="mt-sp-6">
              <h2 className="font-fraunces text-xl font-semibold text-ink">{section.heading}</h2>
              {section.list && (
                <ul className="mt-sp-2 flex list-disc flex-col gap-sp-2 pl-sp-5 leading-relaxed text-ink/80">
                  {section.list.map((item) => (
                    <li key={item}>{linkify(item)}</li>
                  ))}
                </ul>
              )}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-sp-2 leading-relaxed text-ink/80">
                  {linkify(paragraph)}
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
