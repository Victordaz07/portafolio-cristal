import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import {
  INTERNAL_HEADERS,
  RESERVED_SLUGS,
  SCOPE_HEADER,
  SESSION_CREATOR_HEADER,
  SESSION_USER_HEADER,
  SITE_SLUG_HEADER,
} from "@/lib/tenant-headers";

// Páginas y APIs del panel que se pueden abrir sin sesión.
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/registro"];
const PUBLIC_API_PATHS = ["/api/admin/login", "/api/admin/register"];

/** Dirección provisional del sitio de una creadora: /s/<slug>/... */
const SITE_PATH = /^\/s\/([a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9]))(\/.*)?$/;

/** Dominios de la plataforma (no son de una creadora): foliocrew.app, www. y app. */
function isPlatformHost(host: string) {
  const root = (process.env.PLATFORM_ROOT_DOMAIN || "").toLowerCase().split(":")[0];
  if (!root) return false;
  const hostname = host.toLowerCase().split(":")[0];
  return hostname === root || hostname === `www.${root}` || hostname === `app.${root}`;
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

  // En foliocrew.app (y www./app.) la portada es la de Foliocrew, no la de una creadora.
  if (pathname === "/" && isPlatformHost(request.headers.get("host") || "")) {
    pathname = "/foliocrew";
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Todo menos archivos estáticos: el sitio público también necesita saber de qué creadora es.
  matcher: ["/((?!_next/static|_next/image|images/|brand/|favicon|icon|apple-icon).*)"],
};
