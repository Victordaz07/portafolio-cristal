"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_LANG_COOKIE, type AdminLang } from "@/lib/admin-lang";
import { useT } from "./AdminLang";

/** Selector ES / EN del panel. Guarda la preferencia en la cookie y en la cuenta. */
export default function LangSwitch({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { lang, t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function choose(next: AdminLang) {
    if (next === lang || busy) return;
    setBusy(true);
    document.cookie = `${ADMIN_LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    await fetch("/api/admin/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: next }),
    }).catch(() => null);
    setBusy(false);
    router.refresh();
  }

  const base = "rounded-full px-sp-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] transition";
  const on = tone === "dark" ? "bg-cream text-ink" : "bg-ink text-cream";
  const off = tone === "dark" ? "text-cream/70 hover:text-cream" : "text-ink/60 hover:text-ink";
  return (
    <div
      role="group"
      aria-label={t("Idioma del panel", "Dashboard language")}
      className={`flex items-center justify-center gap-1 rounded-full border p-0.5 ${tone === "dark" ? "border-cream/25" : "border-line"}`}
    >
      {(["es", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => choose(code)}
          aria-pressed={lang === code}
          disabled={busy}
          className={`${base} ${lang === code ? on : off}`}
        >
          {code === "es" ? "Español" : "English"}
        </button>
      ))}
    </div>
  );
}
