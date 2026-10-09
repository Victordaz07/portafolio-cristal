"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutIcon } from "@/components/icons";

const NAV = [
  { href: "/admin/agencia", label: "Inicio", exact: true },
  { href: "/admin/agencia/clientes", label: "Clientes" },
  { href: "/admin/agencia/equipo", label: "Equipo" },
  { href: "/admin/agencia/dominio", label: "Mi dominio" },
  { href: "/admin/agencia/facturacion", label: "Facturación" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Panel de una agencia (plan Crew) viéndose a sí misma: cartera, equipo, dominio y facturación.
 * No tiene nada de lo que ve una creadora (Hero, media kit, enlaces, tienda…) — ver docs del plan Crew. */
export default function AgencyShell({ children, agencyName }: { children: ReactNode; agencyName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex items-center justify-between border-b border-line bg-white px-sp-5 py-sp-3">
        <div className="flex items-center gap-sp-6">
          <span className="font-fraunces italic text-lg font-semibold text-ink">{agencyName}</span>
          <nav className="hidden gap-sp-4 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${isActive(pathname, item.href, item.exact) ? "text-coral" : "text-ink/60 hover:text-ink"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button type="button" onClick={handleLogout} className="flex items-center gap-sp-1.5 text-sm text-ink/60 hover:text-coral">
          <LogoutIcon className="h-4 w-4" /> Salir
        </button>
      </header>
      <nav className="flex gap-sp-4 overflow-x-auto border-b border-line bg-white px-sp-5 py-sp-2 md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={`whitespace-nowrap text-sm font-medium ${isActive(pathname, item.href, item.exact) ? "text-coral" : "text-ink/60"}`}>
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="mx-auto max-w-5xl px-sp-5 py-sp-7">{children}</main>
    </div>
  );
}
