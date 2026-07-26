"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  DashboardIcon,
  SparkleIcon,
  ChartIcon,
  MenuIcon as FeedIcon,
  TagIcon,
  StarIcon,
  CameraIcon,
  BoxIcon,
  QuoteIcon,
  QuestionIcon,
  GearIcon,
  InboxIcon,
  LogoutIcon,
  CloseIcon,
  BookIcon,
} from "@/components/icons";

type NavItem = { href: string; label: string; icon: (props: { className?: string }) => ReactNode };

const NAV_GROUPS: { title: string | null; items: NavItem[] }[] = [
  {
    title: null,
    items: [{ href: "/admin", label: "Panel", icon: DashboardIcon }],
  },
  {
    title: "Contenido",
    items: [
      { href: "/admin/hero", label: "Hero", icon: SparkleIcon },
      { href: "/admin/media-kit", label: "Media kit", icon: ChartIcon },
      { href: "/admin/feed", label: "Feed", icon: FeedIcon },
      { href: "/admin/marcas", label: "Marcas", icon: TagIcon },
    ],
  },
  {
    title: "Confianza",
    items: [
      { href: "/admin/resenas", label: "Reseñas destacadas", icon: StarIcon },
      { href: "/admin/servicios", label: "Cómo trabajo", icon: CameraIcon },
      { href: "/admin/paquetes", label: "Paquetes", icon: BoxIcon },
      { href: "/admin/testimonios", label: "Testimonios", icon: QuoteIcon },
    ],
  },
  {
    title: "Sitio",
    items: [
      { href: "/admin/faq", label: "FAQ", icon: QuestionIcon },
      { href: "/admin/contacto", label: "Contacto", icon: GearIcon },
    ],
  },
  {
    title: "Ayuda",
    items: [{ href: "/admin/ayuda", label: "Manual de uso", icon: BookIcon }],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export default function AdminShell({
  children,
  unreadMessages = 0,
}: {
  children: ReactNode;
  unreadMessages?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream md:flex">
      <div className="flex items-center justify-between bg-cobalt px-sp-5 py-sp-3 text-cream md:hidden">
        <Link href="/admin" className="inline-flex items-center gap-sp-1 font-script text-2xl leading-none">
          Crislia
          <SparkleIcon className="h-3 w-3 text-lime" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/30"
        >
          {mobileOpen ? <CloseIcon className="h-4 w-4" /> : <FeedIcon className="h-4 w-4" />}
        </button>
      </div>

      <aside
        className={`${
          mobileOpen ? "flex" : "hidden"
        } flex-col justify-between bg-cobalt px-sp-5 py-sp-6 text-cream md:flex md:w-64 md:shrink-0`}
      >
        <div>
          <Link
            href="/admin"
            className="hidden items-center gap-sp-1 font-script text-3xl leading-none md:inline-flex"
          >
            Crislia
            <SparkleIcon className="h-3.5 w-3.5 text-lime" />
          </Link>
          <p className="hidden mt-sp-1 font-mono text-[10px] uppercase tracking-widest text-cream/50 md:block">
            Panel privado
          </p>

          <nav className="flex flex-col gap-sp-5 md:mt-sp-8">
            {NAV_GROUPS.map((group, index) => (
              <div key={group.title ?? `group-${index}`}>
                {group.title && (
                  <p className="mb-sp-1 px-sp-3 font-mono text-[10px] uppercase tracking-widest text-cream/40">
                    {group.title}
                  </p>
                )}
                <div className="flex flex-col gap-sp-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-sp-3 rounded-md px-sp-3 py-sp-2 text-sm transition ${
                          active
                            ? "bg-cream text-cobalt-ink font-medium shadow-sm"
                            : "text-cream/80 hover:bg-cobalt-ink"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <p className="mb-sp-1 px-sp-3 font-mono text-[10px] uppercase tracking-widest text-cream/40">
                Mensajes
              </p>
              <Link
                href="/admin/mensajes"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-sp-3 rounded-md px-sp-3 py-sp-2 text-sm transition ${
                  isActive(pathname, "/admin/mensajes")
                    ? "bg-cream text-cobalt-ink font-medium shadow-sm"
                    : "text-cream/80 hover:bg-cobalt-ink"
                }`}
              >
                <InboxIcon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">Mensajes recibidos</span>
                {unreadMessages > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 font-mono text-[10px] text-white">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            </div>
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-sp-8 flex items-center gap-sp-3 rounded-md border border-cream/25 px-sp-3 py-sp-2 text-left text-sm text-cream/80 hover:bg-cobalt-ink"
        >
          <LogoutIcon className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </aside>

      <div className="flex-1">
        <div className="flex justify-end border-b border-line bg-white px-sp-5 py-sp-3 md:px-sp-8">
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-sp-2 rounded-full border border-line px-sp-4 py-sp-2 text-sm font-medium text-ink hover:border-coral hover:text-coral transition"
          >
            <FeedIcon className="h-4 w-4" />
            Ver sitio
          </Link>
        </div>
        <main className="px-sp-5 py-sp-7 md:px-sp-8 md:py-sp-8">{children}</main>
      </div>
    </div>
  );
}
