"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/** ES / EN con el idioma activo teñido del acento. */
export default function LocaleSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
    router.refresh();
  }
  return (
    <div role="group" aria-label="Idioma / Language" className="flex rounded-full border border-line bg-surface p-0.5 font-mono text-[10px] font-bold uppercase tracking-widest shadow-fc-card">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          onClick={() => choose(l)}
          className={`rounded-full px-sp-3 py-1 uppercase transition-colors ${locale === l ? "bg-coral text-white" : "text-ink/55 hover:text-ink"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
