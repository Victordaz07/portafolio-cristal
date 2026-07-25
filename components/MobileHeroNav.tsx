"use client";

import { useState } from "react";
import { MenuIcon, CloseIcon, SparkleIcon } from "@/components/icons";

export default function MobileHeroNav({
  name,
  links,
}: {
  name: string;
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute inset-x-0 top-0 z-20">
      <div className="flex items-center justify-between px-sp-5 py-sp-3">
        <span className="inline-flex items-center gap-sp-1 font-script text-4xl leading-none text-ink">
          {name}
          <SparkleIcon className="h-4 w-4 text-ink" />
        </span>
        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/25 bg-cream/70 text-ink backdrop-blur-sm"
        >
          {open ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="mx-sp-5 mt-sp-2 rounded-md border border-line bg-cream p-sp-3 shadow-lg">
          <ul className="flex flex-col font-mono text-xs uppercase tracking-wide text-ink">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-sm px-sp-2 py-sp-3 hover:text-coral"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
