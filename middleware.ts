import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { INTERNAL_HEADERS, SCOPE_HEADER, SESSION_CREATOR_HEADER, SESSION_USER_HEADER } from "@/lib/tenant-headers";

// Páginas y APIs del panel que se pueden abrir sin sesión.
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/registro"];
const PUBLIC_API_PATHS = ["/api/admin/login", "/api/admin/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Las cabeceras internas solo las pone este middleware: se borran las que mande el navegador.
  const headers = new Headers(request.headers);
  for (const name of INTERNAL_HEADERS) headers.delete(name);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (session) {
    headers.set(SESSION_CREATOR_HEADER, session.creatorId);
    headers.set(SESSION_USER_HEADER, session.userId);
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

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Todo menos archivos estáticos: el sitio público también necesita saber de qué creadora es.
  matcher: ["/((?!_next/static|_next/image|images/|brand/|favicon|icon|apple-icon|robots.txt|sitemap.xml).*)"],
};
