"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { MenuIcon, CloseIcon, LogoutIcon } from "@/components/icons";
import type { T } from "@/lib/admin-lang";
import { useT } from "./AdminLang";
import LangSwitch from "./LangSwitch";

type NavItem = { href: string; label: string; badgeKey?: "unread" | "support" | "tickets"; exact?: boolean };
type NavGroup = { id: string; title: string; items: NavItem[] };

// Navegación agrupada del panel v2. Cada grupo es colapsable; las secciones
// nuevas del diseño (Metas, Bitácora, Calendario, Reportes…) se suman a su
// grupo a medida que se implementan.
const navGroups = (t: T): NavGroup[] => [
  {
    id: "crecimiento",
    title: t("Crecimiento", "Growth"),
    items: [
      { href: "/admin/metas", label: t("Metas y plan", "Goals & plan") },
      { href: "/admin/bitacora", label: t("Bitácora", "Journal") },
    ],
  },
  {
    id: "contenido",
    title: t("Contenido", "Content"),
    items: [
      { href: "/admin/feed", label: t("Feed / Publicaciones", "Feed / Posts") },
      { href: "/admin/calendario", label: t("Calendario", "Calendar") },
      { href: "/admin/crear", label: t("Crear", "Create") },
    ],
  },
  {
    id: "landing",
    title: t("Landing", "Landing page"),
    items: [
      { href: "/admin/vista-publica", label: t("Vista pública", "Public view") },
      { href: "/admin/apariencia", label: t("Estudio de diseño", "Design studio") },
      { href: "/admin/enlaces", label: t("Link en bio", "Link in bio") },
      { href: "/admin/dominio", label: t("Mi dominio", "My domain") },
      { href: "/admin/hero", label: t("Portada (Hero)", "Cover (Hero)") },
      { href: "/admin/media-kit", label: t("Media kit", "Media kit") },
      { href: "/admin/servicios", label: t("Cómo trabajo", "How I work") },
      { href: "/admin/paquetes", label: t("Paquetes", "Packages") },
      { href: "/admin/faq", label: t("FAQ", "FAQ") },
      { href: "/admin/contacto", label: t("Contacto y pie", "Contact & footer") },
    ],
  },
  {
    id: "social",
    title: t("Prueba social", "Social proof"),
    items: [
      { href: "/admin/marcas", label: t("Marcas", "Brands") },
      { href: "/admin/resenas", label: t("Reseñas destacadas", "Featured reviews") },
      { href: "/admin/testimonios", label: t("Testimonios", "Testimonials") },
    ],
  },
  {
    id: "negocio",
    title: t("Negocio", "Business"),
    items: [
      { href: "/admin/mensajes", label: t("Bandeja", "Inbox"), badgeKey: "unread" },
      { href: "/admin/reportes", label: t("Reportes", "Reports") },
      { href: "/admin/conectar", label: t("Conectar cuentas", "Connect accounts") },
    ],
  },
  {
    id: "ayuda",
    title: t("Ayuda", "Help"),
    items: [
      { href: "/admin/ayuda", label: t("Manual de uso", "User guide") },
      { href: "/admin/soporte", label: t("Soporte", "Support"), badgeKey: "support" },
      { href: "/admin/ideas", label: t("Ideas y sugerencias", "Ideas & suggestions") },
      { href: "/admin/plan", label: t("Mi plan", "My plan") },
      { href: "/admin/cuenta", label: t("Mi cuenta", "My account") },
    ],
  },
];

/** Departamentos del equipo: cada uno aparece según los roles de la persona. */
function departmentItems(team: { owner: boolean; roles: string[] } | null, t: T): NavItem[] {
  if (!team) return [];
  const has = (role: string) => team.owner || team.roles.includes(role);
  const items: NavItem[] = [];
  if (has("support")) items.push({ href: "/admin/equipo/soporte", label: t("Centro de ayuda", "Help center"), badgeKey: "tickets" });
  if (has("growth")) items.push({ href: "/admin/equipo/ideas", label: t("Centro de sugerencias", "Suggestions center") });
  if (has("data")) items.push({ href: "/admin/equipo/datos", label: t("Recuperación de datos", "Data recovery") });
  if (team.owner) items.push({ href: "/admin/equipo/personas", label: t("Personas del equipo", "Team members") });
  return items;
}

/**
 * Grupo "Foliocrew". El Dueño ve el Centro de mando con todos los departamentos debajo;
 * las demás personas del equipo ven solo el centro del equipo y sus departamentos.
 */
function foliocrewGroup(platformAdmin: boolean, team: { owner: boolean; roles: string[] } | null, t: T): NavGroup | null {
  const departments = departmentItems(team, t);
  if (platformAdmin) {
    return {
      id: "foliocrew",
      title: "Foliocrew",
      items: [
        { href: "/admin/plataforma", label: t("Centro de mando", "Command center") },
        ...departments,
        { href: "/admin/lista-de-espera", label: t("Lista de espera", "Waitlist") },
      ],
    };
  }
  if (!departments.length) return null;
  return { id: "equipo", title: t("Equipo Foliocrew", "Foliocrew team"), items: [{ href: "/admin/equipo", label: t("Centro del equipo", "Team hub"), exact: true }, ...departments] };
}

const OPEN_GROUPS_KEY = "admin-nav-open-groups";

function isActive(pathname: string, href: string, exact = false) {
  return href === "/admin" || exact ? pathname === href : pathname.startsWith(href);
}

export default function AdminShell({
  children,
  unreadMessages = 0,
  creatorName = "",
  siteUrl = "/",
  platformAdmin = false,
  team = null,
  supportUnread = 0,
  openTickets = 0,
}: {
  children: ReactNode;
  unreadMessages?: number;
  creatorName?: string;
  siteUrl?: string;
  /** Quien administra Foliocrew: ve el grupo "Foliocrew" (cuentas y lista de espera). */
  platformAdmin?: boolean;
  /** Persona del equipo de Foliocrew: ve el grupo "Equipo Foliocrew" según sus roles. */
  team?: { owner: boolean; roles: string[] } | null;
  /** Respuestas de soporte que la cuenta todavía no vio. */
  supportUnread?: number;
  /** Tickets abiertos (para Soporte). */
  openTickets?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useT();
  const NAV_GROUPS = navGroups(t);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups(t).map((g) => [g.id, true]))
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

  const badges = { unread: unreadMessages, support: supportUnread, tickets: openTickets };
  const homeActive = isActive(pathname, "/admin");

  return (
    <div className="min-h-screen bg-cream md:flex">
      <div className="flex items-center justify-between bg-ink px-sp-5 py-sp-3 text-cream md:hidden print:hidden">
        <Link href="/admin" aria-label={t("Foliocrew — inicio del panel", "Foliocrew — dashboard home")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-claro.svg" alt="Foliocrew" className="h-7 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? t("Cerrar menú", "Close menu") : t("Abrir menú", "Open menu")}
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
          <Link href="/admin" aria-label={t("Foliocrew — inicio del panel", "Foliocrew — dashboard home")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-claro.svg" alt="Foliocrew" className="h-8 w-auto" />
          </Link>
          <p className="mt-sp-1 font-mono text-[9px] uppercase tracking-[0.16em] text-lime">
            {creatorName ? t(`Panel de ${creatorName.split(" ")[0]}`, `${creatorName.split(" ")[0]}'s dashboard`) : t("Panel privado", "Private dashboard")}
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
          {t("Resumen", "Overview")}
        </Link>

        <nav className="-mx-1 mt-sp-1 flex flex-1 flex-col gap-sp-1 overflow-y-auto px-1">
          {[...NAV_GROUPS, ...[foliocrewGroup(platformAdmin, team, t)].filter((g): g is NavGroup => Boolean(g))].map((group) => {
            const groupActive = group.items.some((item) => isActive(pathname, item.href, item.exact));
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
                      const active = isActive(pathname, item.href, item.exact);
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
          <LangSwitch />
          <Link
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-cream/25 px-3.5 py-2.5 text-center text-xs font-semibold text-cream transition hover:bg-cream/10"
          >
            {t("Ver sitio público ↗", "View public site ↗")}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-sp-2 rounded-full border border-cream/25 px-3 py-2 text-[11px] text-cream/80 transition hover:bg-cream/10"
          >
            <LogoutIcon className="h-3.5 w-3.5" />
            {t("Cerrar sesión", "Log out")}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-sp-5 py-7 md:px-sp-6 md:py-sp-6 print:p-0">{children}</main>
    </div>
  );
}
