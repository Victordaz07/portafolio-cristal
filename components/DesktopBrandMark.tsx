"use client";

import { useRef, useState } from "react";
import { SparkleIcon } from "@/components/icons";
import AdminLoginModal from "@/components/AdminLoginModal";
import type { Locale } from "@/lib/i18n";

const TAP_COUNT_TO_OPEN = 3;
const TAP_RESET_MS = 1500;

export default function DesktopBrandMark({ name, locale }: { name: string; locale: Locale }) {
  const [loginOpen, setLoginOpen] = useState(false);
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
      setLoginOpen(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTap}
        aria-label={name}
        className="inline-flex shrink-0 items-center gap-sp-1 font-script text-2xl leading-none"
      >
        {name}
        <SparkleIcon className="h-3.5 w-3.5 text-lime" />
      </button>
      {loginOpen && <AdminLoginModal onClose={() => setLoginOpen(false)} locale={locale} />}
    </>
  );
}
