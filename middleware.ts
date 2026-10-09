import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { AMBASSADOR, REF_COOKIE, normalizeReferralCode } from "@/lib/ambassadors";
import {
  INTERNAL_HEADERS,
  RESERVED_SLUGS,
  SCOPE_HEADER,
  SESSION_CREATOR_HEADER,
  SESSION_USER_HEADER,
  SESSION_VERSION_HEADER,
  SESSION_ACTOR_HEADER,
  SESSION_VIA_HEADER,
  SITE_SLUG_HEADER,
} from "@/lib/tenant-headers";
import { sameOrigin } from "@/lib/login-guard";

// Páginas y APIs del panel que se pueden abrir sin sesión.
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/registro", "/admin/recuperar", "/admin/restablecer"];
const PUBLIC_API_PATHS = ["/api/admin/login", "/api/admin/register", "/api/admin/password/", "/api/admin/verify-email"];

/** Dirección provisional del sitio de una creadora: /s/<slug>/... */
const SITE_PATH = /^\/s\/([a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9]))(\/.*)?$/;

/** Dominios de la plataforma (no son de una creadora): foliocrew.pro, www. y app. */
function isPlatformHost(host: string) {
  const root = (process.env.PLATFORM_ROOT_DOMAIN || "").toLowerCase().split(":")[0];
  if (!root) return false;
  const hostname = host.toLowerCase().split(":")[0];
  return hostname === root || hostname === `www.${root}` || hostname === `app.${root}`;
}

/** Si el panel se abrió en otro dominio (subdominio, dominio propio, vercel.app), el origen correcto; si no, null. */
function panelHost(host: string) {
  const root = (process.env.PLATFORM_ROOT_DOMAIN || "").toLowerCase();
  if (!root || host.toLowerCase() === root) return null;
  const hostname = root.split(":")[0];
  const protocol = hostname === "localhost" || hostname.endsWith(".localhost") ? "http" : "https";
  return `${protocol}://${root}`;
}

/** Guarda el código de un enlace de embajadora (?ref=) 30 días; solo en la portada de Foliocrew y el registro. */
function rememberReferral(request: NextRequest, response: NextResponse, pathname: string) {
  const onLanding = pathname === "/" || pathname === "/foliocrew";
  if (!onLanding && pathname !== "/admin/registro") return response;
  if (onLanding && !isPlatformHost(request.headers.get("host") || "")) return response;
  const code = normalizeReferralCode(request.nextUrl.searchParams.get("ref"));
  if (!code) return response;
  response.cookies.set(REF_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AMBASSADOR.cookieDays * 86_400,
  });
  return response;
}

export async function middleware(request: NextRequest) {
  let { pathname } = request.nextUrl;

  // Las cabeceras internas solo las pone este middleware: se borran las que mande el navegador.
  const headers = new Headers(request.headers);
  for (const name of INTERNAL_HEADERS) headers.delete(name);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (session) {
    headers.set(SESSION_CREATOR_HEADER, session.creatorId);
    headers.set(SESSION_USER_HEADER, session.userId);
    headers.set(SESSION_VERSION_HEADER, String(session.sv ?? 0));
    if (session.actorId) headers.set(SESSION_ACTOR_HEADER, session.actorId);
    if (session.via) headers.set(SESSION_VIA_HEADER, session.via);
  }

  // /s/<slug>/… → el sitio de esa creadora (antes de tener subdominio o dominio propio).
  const site = pathname.match(SITE_PATH);
  if (site && !RESERVED_SLUGS.has(site[1])) {
    const rest = site[2] || "/";
    if (!rest.startsWith("/admin") && !rest.startsWith("/api/admin")) {
      headers.set(SITE_SLUG_HEADER, site[1]);
      const url = request.nextUrl.clone();
      url.pathname = rest;
      return NextResponse.rewrite(url, { request: { headers } });
    }
  }

  const isApi = pathname.startsWith("/api/admin");
  const isAdmin = isApi || pathname === "/admin" || pathname.startsWith("/admin/");

  // El panel vive en un solo lugar (foliocrew.pro/admin): la sesión y la conexión con las redes
  // (Instagram, TikTok, YouTube) necesitan una sola dirección de regreso registrada.
  const canonical = panelHost(request.headers.get("host") || "");
  if (isAdmin && !isApi && canonical && request.method === "GET") {
    const url = new URL(`${pathname}${request.nextUrl.search}`, canonical);
    return NextResponse.redirect(url, 308);
  }

  // Las APIs del panel solo aceptan cambios pedidos desde la misma dirección: otro sitio (u otro
  // subdominio) no puede hacer que tu navegador mande una petición con tu sesión.
  if (isApi && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const hosts = [request.headers.get("x-forwarded-host"), request.headers.get("host"), request.nextUrl.host];
    if (!sameOrigin(request.headers.get("origin"), hosts)) {
      return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
    }
  }

  if (isAdmin) {
    headers.set(SCOPE_HEADER, "admin");
    const isPublic = isApi
      ? PUBLIC_API_PATHS.some((path) => pathname.startsWith(path))
      : PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path));
    if (!isPublic && !session) {
      if (isApi) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // En foliocrew.pro (y www./app.) la portada es la de Foliocrew, no la de una creadora.
  if (pathname === "/" && isPlatformHost(request.headers.get("host") || "")) {
    pathname = "/foliocrew";
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    return rememberReferral(request, NextResponse.rewrite(url, { request: { headers } }), "/");
  }

  return rememberReferral(request, NextResponse.next({ request: { headers } }), pathname);
}

export const config = {
  // Todo menos archivos estáticos: el sitio público también necesita saber de qué creadora es.
  matcher: ["/((?!_next/static|_next/image|images/|brand/|favicon|icon|apple-icon).*)"],
};
