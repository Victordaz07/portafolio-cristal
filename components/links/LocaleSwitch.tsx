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
    <div role="group" aria-label="Idioma / Language" className="flex gap-0.5 rounded-full border border-cobalt/15 bg-surface/65 p-[3px] text-[11px] font-bold">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          onClick={() => choose(l)}
          className={`rounded-full px-[11px] py-[5px] uppercase transition-colors ${locale === l ? "bg-moss text-white" : "text-cobalt hover:bg-cobalt/5"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
