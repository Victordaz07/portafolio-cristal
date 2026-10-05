// Idioma del panel (español o inglés). Sin dependencias de servidor: se usa también en el navegador.
// Uso: t("Guardar", "Save"). El texto en español va primero y el inglés al lado, así se ve todo junto.

export type AdminLang = "es" | "en";

export const ADMIN_LANG_COOKIE = "admin_lang";

export type T = (es: string, en: string) => string;

export const isAdminLang = (value: unknown): value is AdminLang => value === "es" || value === "en";

export function makeT(lang: AdminLang): T {
  return (es, en) => (lang === "en" ? en : es);
}

/** Locale para fechas y números (toLocaleString). */
export const dateLocale = (lang: AdminLang) => (lang === "en" ? "en-US" : "es");

/** "1 día" / "3 días" en el idioma del panel. */
export function plural(lang: AdminLang, n: number, es: [string, string], en: [string, string]) {
  const [one, many] = lang === "en" ? en : es;
  return `${n} ${n === 1 ? one : many}`;
}

/** Elige la etiqueta en inglés de una constante con `label` / `labelEn`. */
export function pickLabel(lang: AdminLang, item: { label: string; labelEn?: string | null }) {
  return lang === "en" && item.labelEn ? item.labelEn : item.label;
}

/** Mensajes propios de validación (zod) en inglés. */
const VALIDATION_EN: Record<string, string> = {
  "Debes indicar la URL del post o subir un video/foto propio": "Add the post URL or upload your own video/photo",
  "Elige al menos una red": "Choose at least one network",
  "Escribe un título": "Write a title",
  "La contraseña debe tener al menos 8 caracteres": "Password must be at least 8 characters",
  "La contraseña nueva debe tener al menos 8 caracteres": "The new password must be at least 8 characters",
  "Ponle un título al grupo": "Give the group a title",
};

/** Primer error de validación en el idioma del panel (o un mensaje general). */
export function validationMessage(t: T, message?: string) {
  if (!message) return t("Revisa los datos", "Check the details");
  const en = VALIDATION_EN[message];
  if (en) return t(message, en);
  // Mensajes genéricos de zod (vienen en inglés): en español damos uno general.
  return /[áéíóúñ¿¡]/i.test(message) || !/^[A-Z]/.test(message) ? t(message, "Check the details") : t("Revisa los datos", message);
}
