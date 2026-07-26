"use client";

import { useRef, useState } from "react";
import { MenuIcon, CloseIcon, SparkleIcon } from "@/components/icons";
import AdminLoginModal from "@/components/AdminLoginModal";
import LocaleToggle from "@/components/LocaleToggle";
import { t, type Locale } from "@/lib/i18n";

const TAP_COUNT_TO_OPEN = 3;
const TAP_RESET_MS = 1500;

export default function MobileHeroNav({
  name,
  links,
  locale,
}: {
  name: string;
  links: { href: string; label: string }[];
  locale: Locale;
}) {
  const copy = t(locale);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const tapCount = useRef(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSparkleTap() {
    tapCount.current += 1;

    if (tapTimeout.current) clearTimeout(tapTimeout.current);
    tapTimeout.current = setTimeout(() => {
      tapCount.current = 0;
    }, TAP_RESET_MS);

    if (tapCount.current >= TAP_COUNT_TO_OPEN) {
      tapCount.current = 0;
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      setLoginOpen(true);
    }
  }

  return (
    <div className="absolute inset-x-0 top-0 z-20">
      <div className="flex items-center justify-between px-sp-5 py-sp-3">
        <span className="inline-flex items-center gap-sp-1 font-script text-4xl leading-none text-ink">
          {name}
          <button
            type="button"
            onClick={handleSparkleTap}
            aria-label="Cristal"
            className="p-sp-1 -m-sp-1"
          >
            <SparkleIcon className="h-4 w-4 text-ink" />
          </button>
        </span>
        <div className="flex shrink-0 items-center gap-sp-2">
          <LocaleToggle
            locale={locale}
            className="rounded-full border border-ink/25 bg-cream/70 px-sp-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink backdrop-blur-sm"
          />
          <button
            type="button"
            aria-label={open ? copy.mobileNav.closeMenu : copy.mobileNav.openMenu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/25 bg-cream/70 text-ink backdrop-blur-sm"
          >
            {open ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-sp-5 mt-sp-2 rounded-md border border-line bg-cream p-sp-3 shadow-lg">
          <ul className="flex flex-col font-mono text-xs uppercase tracking-wide text-ink">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-sm px-sp-2 py-sp-3 hover:text-coral"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loginOpen && <AdminLoginModal onClose={() => setLoginOpen(false)} locale={locale} />}
    </div>
  );
}
