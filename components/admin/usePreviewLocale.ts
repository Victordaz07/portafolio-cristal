"use client";

import { useEffect, useState } from "react";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { useT } from "./AdminLang";

/**
 * Con el panel en inglés, las vistas previas del sitio público también empiezan en inglés
 * (si la persona no eligió otro idioma antes). Devuelve true cuando ya se puede cargar el iframe.
 */
export function usePreviewLocale() {
  const { lang } = useT();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const cookies = document.cookie.split("; ");
    if (lang === "en" && !cookies.some((c) => c.startsWith(`${LOCALE_COOKIE}=`))) {
      document.cookie = `${LOCALE_COOKIE}=en; path=/; max-age=31536000`;
    }
    setReady(true);
  }, [lang]);
  return ready;
}
