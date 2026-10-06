import { cookies, headers } from "next/headers";
import { ADMIN_LANG_COOKIE, isAdminLang, makeT, type AdminLang } from "./admin-lang";

/**
 * Idioma del panel para esta petición: la cookie que guarda el selector ES/EN; si no hay,
 * el idioma del navegador (inglés si lo pide primero) y si no, español.
 */
export async function getAdminLang(): Promise<AdminLang> {
  const saved = (await cookies()).get(ADMIN_LANG_COOKIE)?.value;
  if (isAdminLang(saved)) return saved;
  const accept = ((await headers()).get("accept-language") ?? "").toLowerCase();
  return accept.startsWith("en") ? "en" : "es";
}

/** `const { t, lang } = await getT();` en páginas de servidor y rutas de API. */
export async function getT() {
  const lang = await getAdminLang();
  return { lang, t: makeT(lang) };
}
