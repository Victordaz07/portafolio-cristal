"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/hero", label: "Hero" },
  { href: "/admin/media-kit", label: "Media kit" },
  { href: "/admin/feed", label: "Feed" },
  { href: "/admin/resenas", label: "Reseñas destacadas" },
  { href: "/admin/servicios", label: "Cómo trabajo" },
  { href: "/admin/testimonios", label: "Testimonios" },
  { href: "/admin/paquetes", label: "Paquetes" },
  { href: "/admin/marcas", label: "Marcas" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/contacto", label: "Contacto" },
  { href: "/admin/mensajes", label: "Mensajes recibidos" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream md:flex">
      <aside className="flex flex-col justify-between bg-cobalt px-sp-5 py-sp-6 text-cream md:w-64 md:shrink-0">
        <div>
          <p className="font-bodoni italic font-bold uppercase text-lg">Crislia — Admin</p>
          <nav className="mt-sp-8 flex flex-col gap-sp-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-sm px-sp-3 py-sp-2 text-sm transition ${
                    isActive ? "bg-cream text-cobalt font-medium" : "text-cream/85 hover:bg-cobalt-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-sp-8 rounded-sm border border-cream/30 px-sp-3 py-sp-2 text-left text-sm text-cream/85 hover:bg-cobalt-ink"
        >
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 px-sp-5 py-sp-7 md:px-sp-8 md:py-sp-8">{children}</main>
    </div>
  );
}
