"use client";

import { useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { MOTIVATIONAL_PHRASES } from "@/lib/motivational-phrases";
import MotivationCard from "@/components/MotivationCard";

const TAP_COUNT_TO_OPEN = 2;
const TAP_RESET_MS = 1200;

export default function MotivationTrigger({
  locale,
  children,
  className,
  ariaLabel,
}: {
  locale: Locale;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const tapCount = useRef(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTap() {
    tapCount.current += 1;

    if (tapTimeout.current) clearTimeout(tapTimeout.current);
    tapTimeout.current = setTimeout(() => {
      tapCount.current = 0;
    }, TAP_RESET_MS);

    if (tapCount.current >= TAP_COUNT_TO_OPEN) {
      tapCount.current = 0;
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      const random = MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)];
      setPhrase(locale === "en" ? random.en : random.es);
      setOpen(true);
    }
  }

  return (
    <>
      <button type="button" onClick={handleTap} aria-label={ariaLabel} className={className}>
        {children}
      </button>
      {open && <MotivationCard phrase={phrase} onClose={() => setOpen(false)} />}
    </>
  );
}
