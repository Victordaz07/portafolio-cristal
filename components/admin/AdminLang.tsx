"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, type AdminLang, type T } from "@/lib/admin-lang";

const AdminLangContext = createContext<{ lang: AdminLang; t: T }>({ lang: "es", t: makeT("es") });

/** Da el idioma del panel a todos los componentes de cliente. */
export function AdminLangProvider({ lang, children }: { lang: AdminLang; children: ReactNode }) {
  const value = useMemo(() => ({ lang, t: makeT(lang) }), [lang]);
  return <AdminLangContext.Provider value={value}>{children}</AdminLangContext.Provider>;
}

/** `const { t, lang } = useT();` en componentes de cliente del panel. */
export function useT() {
  return useContext(AdminLangContext);
}
