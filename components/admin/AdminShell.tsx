"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { MenuIcon, CloseIcon, LogoutIcon } from "@/components/icons";

type NavItem = { href: string; label: string; badgeKey?: "unread" };
type NavGroup = { id: string; title: string; items: NavItem[] };

// Navegación agrupada del panel v2. Cada grupo es colapsable; las secciones
// nuevas del diseño (Metas, Bitácora, Calendario, Reportes…) se suman a su
// grupo a medida que se implementan.
const NAV_GROUPS: NavGroup[] = [
  {
    id: "crecimiento",
    title: "Crecimiento",
    items: [
      { href: "/admin/metas", label: "Metas y plan" },
      { href: "/admin/bitacora", label: "Bitácora" },
    ],
  },
  {
    id: "contenido",
    title: "Contenido",
    items: [
      { href: "/admin/feed", label: "Feed / Publicaciones" },
      { href: "/admin/calendario", label: "Calendario" },
      { href: "/admin/crear", label: "Crear" },
    ],
  },
  {
    id: "landing",
    title: "Landing",
    items: [
      { href: "/admin/vista-publica", label: "Vista pública" },
      { href: "/admin/apariencia", label: "Estudio de diseño" },
      { href: "/admin/enlaces", label: "Link en bio" },
      { href: "/admin/dominio", label: "Mi dominio" },
      { href: "/admin/hero", label: "Portada (Hero)" },
      { href: "/admin/media-kit", label: "Media kit" },
      { href: "/admin/servicios", label: "Cómo trabajo" },
      { href: "/admin/paquetes", label: "Paquetes" },
      { href: "/admin/faq", label: "FAQ" },
      { href: "/admin/contacto", label: "Contacto y pie" },
    ],
  },
  {
    id: "social",
    title: "Prueba social",
    items: [
      { href: "/admin/marcas", label: "Marcas" },
      { href: "/admin/resenas", label: "Reseñas destacadas" },
      { href: "/admin/testimonios", label: "Testimonios" },
    ],
  },
  {
    id: "negocio",
    title: "Negocio",
    items: [
      { href: "/admin/mensajes", label: "Bandeja", badgeKey: "unread" },
      { href: "/admin/reportes", label: "Reportes" },
      { href: "/admin/conectar", label: "Conectar cuentas" },
    ],
  },
  {
    id: "ayuda",
    title: "Ayuda",
    items: [
      { href: "/admin/ayuda", label: "Manual de uso" },
      { href: "/admin/plan", label: "Mi plan" },
      { href: "/admin/cuenta", label: "Mi cuenta" },
    ],
  },
];

// Solo para quien administra la plataforma.
const PLATFORM_GROUP: NavGroup = {
  id: "foliocrew",
  title: "Foliocrew",
  items: [
    { href: "/admin/plataforma", label: "Centro de mando" },
    { href: "/admin/lista-de-espera", label: "Lista de espera" },
  ],
};

const OPEN_GROUPS_KEY = "admin-nav-open-groups";

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export default function AdminShell({
  children,
  unreadMessages = 0,
  creatorName = "",
  siteUrl = "/",
  platformAdmin = false,
}: {
  children: ReactNode;
  unreadMessages?: number;
  creatorName?: string;
  siteUrl?: string;
  /** Quien administra Foliocrew: ve el grupo "Foliocrew" (cuentas y lista de espera). */
  platformAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.id, true]))
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(OPEN_GROUPS_KEY);
      if (saved) setOpenGroups((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch {
      // Sin acceso a localStorage: todos los grupos quedan abiertos.
    }
  }, []);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
      } catch {
        // Ignorado: la preferencia solo dura esta visita.
      }
      return next;
    });
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const badges = { unread: unreadMessages };
  const homeActive = isActive(pathname, "/admin");

  return (
    <div className="min-h-screen bg-cream md:flex">
      <div className="flex items-center justify-between bg-ink px-sp-5 py-sp-3 text-cream md:hidden print:hidden">
        <Link href="/admin" aria-label="Foliocrew — inicio del panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-claro.svg" alt="Foliocrew" className="h-7 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/30"
        >
          {mobileOpen ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
        </button>
      </div>

      <aside
        className={`${
          mobileOpen ? "flex" : "hidden"
        } flex-col gap-3.5 bg-ink px-sp-4 py-7 text-cream print:hidden md:sticky md:top-0 md:flex md:h-screen md:w-[250px] md:shrink-0`}
      >
        <div className="mb-sp-2 hidden md:block">
          <Link href="/admin" aria-label="Foliocrew — inicio del panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-claro.svg" alt="Foliocrew" className="h-8 w-auto" />
          </Link>
          <p className="mt-sp-1 font-mono text-[9px] uppercase tracking-[0.16em] text-lime">
            {creatorName ? `Panel de ${creatorName.split(" ")[0]}` : "Panel privado"}
          </p>
        </div>

        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-sp-2 rounded-[10px] px-sp-3 py-2.5 text-[13px] font-bold transition ${
            homeActive ? "bg-coral text-white" : "text-cream hover:bg-cream/10"
          }`}
        >
          <span aria-hidden className="text-sm">
            ⌂
          </span>
          Resumen
        </Link>

        <nav className="-mx-1 mt-sp-1 flex flex-1 flex-col gap-sp-1 overflow-y-auto px-1">
          {(platformAdmin ? [...NAV_GROUPS, PLATFORM_GROUP] : NAV_GROUPS).map((group) => {
            const groupActive = group.items.some((item) => isActive(pathname, item.href));
            const open = openGroups[group.id] !== false;
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between px-2.5 py-2.5"
                >
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
                      groupActive ? "text-cream" : "text-cream/50"
                    }`}
                  >
                    {group.title}
                  </span>
                  <span
                    aria-hidden
                    className={`text-[10px] text-cream/50 transition-transform ${
                      open ? "" : "-rotate-90"
                    }`}
                  >
                    ▾
                  </span>
                </button>
                {open && (
                  <div className="flex flex-col gap-0.5 pb-1.5">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between rounded-[10px] px-sp-3 py-2.5 text-[13px] font-medium transition ${
                            active ? "bg-coral text-white" : "text-cream/85 hover:bg-cream/10"
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          {badge > 0 && (
                            <span
                              className={`rounded-full px-[7px] py-px font-mono text-[10px] font-bold ${
                                active ? "bg-white text-coral" : "bg-coral text-white"
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex flex-col gap-sp-2">
          <Link
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-cream/25 px-3.5 py-2.5 text-center text-xs font-semibold text-cream transition hover:bg-cream/10"
          >
            Ver sitio público ↗
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-sp-2 rounded-full border border-cream/25 px-3 py-2 text-[11px] text-cream/80 transition hover:bg-cream/10"
          >
            <LogoutIcon className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-sp-5 py-7 md:px-sp-6 md:py-sp-6 print:p-0">{children}</main>
    </div>
  );
}
