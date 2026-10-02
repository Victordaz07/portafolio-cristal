// Cabeceras internas que pone middleware.ts en cada petición. El middleware
// siempre borra las que manda el navegador, así que no se pueden falsificar.
/** "admin" en /admin y /api/admin (los datos salen de la sesión); vacío en el sitio público. */
export const SCOPE_HEADER = "x-fc-scope";
/** Creadora de la sesión iniciada (verificada en el middleware). */
export const SESSION_CREATOR_HEADER = "x-fc-creator";
/** Usuario de la sesión iniciada. */
export const SESSION_USER_HEADER = "x-fc-user";

/** Versión de sesión del token (AdminUser.sessionVersion al iniciar sesión). */
export const SESSION_VERSION_HEADER = "x-fc-sv";

/** Sitio pedido por la dirección provisional /s/<slug> (sin dominio propio ni subdominio). */
export const SITE_SLUG_HEADER = "x-fc-site";

export const INTERNAL_HEADERS = [SCOPE_HEADER, SESSION_CREATOR_HEADER, SESSION_USER_HEADER, SESSION_VERSION_HEADER, SITE_SLUG_HEADER];

/** Subdominios que no pueden ser el nombre del sitio de una creadora. */
export const RESERVED_SLUGS = new Set([
  "app", "www", "admin", "api", "panel", "foliocrew", "blog", "ayuda", "help", "soporte", "support",
  "mail", "email", "static", "assets", "cdn", "dev", "staging", "test", "demo", "login", "registro",
]);
