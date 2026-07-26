"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, t, type Locale } from "@/lib/i18n";

export default function LocaleToggle({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const router = useRouter();
  const copy = t(locale);
  const next: Locale = locale === "es" ? "en" : "es";

  function handleClick() {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copy.localeToggle.switchTo}
      className={
        className ??
        "rounded-full border border-line px-sp-3 py-1 font-mono text-xs uppercase tracking-widest text-ink hover:border-coral hover:text-coral transition"
      }
    >
      {copy.localeToggle.label}
    </button>
  );
}
