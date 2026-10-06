"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { T } from "@/lib/admin-lang";
import { SearchIcon, CloseIcon } from "@/components/icons";
import type { NavGroup } from "./AdminShell";

interface Flat {
  href: string;
  label: string;
  groupTitle: string;
  badge: number;
}

/**
 * Buscador rápido del panel (botón en el menú + atajo Cmd/Ctrl+K desde cualquier pantalla):
 * escribe el nombre de una sección y Enter (o click) para saltar directo, sin tener que abrir
 * el grupo correcto a mano.
 */
export default function CommandPalette({
  groups,
  badges,
  t,
  onNavigate,
}: {
  groups: NavGroup[];
  badges: Record<string, number>;
  t: T;
  /** Se llama después de navegar a un resultado (para cerrar el menú en celular). */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: Flat[] = useMemo(
    () =>
      groups.flatMap((group) =>
        group.items.map((item) => ({
          href: item.href,
          label: item.label,
          groupTitle: group.title,
          badge: item.badgeKey ? badges[item.badgeKey] ?? 0 : 0,
        }))
      ),
    [groups, badges]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q) || item.groupTitle.toLowerCase().includes(q));
  }, [items, query]);

  // Atajo global: Cmd/Ctrl + K abre el buscador desde cualquier pantalla del panel.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    // Pequeña espera para que el input ya esté montado antes de enfocarlo.
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function go(href: string) {
    router.push(href);
    setOpen(false);
    onNavigate?.();
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) go(item.href);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-sp-2 rounded-[10px] border border-cream/15 px-sp-3 py-2 text-left text-cream/60 transition hover:border-cream/30 hover:text-cream/90"
      >
        <SearchIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate text-[12px]">{t("Buscar…", "Search…")}</span>
        <span className="hidden shrink-0 rounded-[6px] border border-cream/20 px-1.5 py-0.5 font-mono text-[9px] text-cream/50 sm:inline">
          ⌘K
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-ink/60 px-sp-4 pt-[12vh]" onClick={() => setOpen(false)}>
          <div onClick={(event) => event.stopPropagation()} className="flex w-full max-w-lg flex-col overflow-hidden rounded-[18px] bg-white shadow-2xl">
            <div className="flex items-center gap-sp-3 border-b border-line px-sp-4 py-sp-3">
              <SearchIcon className="h-4 w-4 shrink-0 text-ink/40" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder={t("Buscar una sección del panel…", "Search a panel section…")}
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
              />
              <button type="button" onClick={() => setOpen(false)} aria-label={t("Cerrar", "Close")}>
                <CloseIcon className="h-4 w-4 text-ink/40 hover:text-ink" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto py-sp-2">
              {results.length === 0 ? (
                <p className="px-sp-4 py-sp-5 text-center text-sm text-ink/50">{t("Sin resultados", "No results")}</p>
              ) : (
                results.map((item, index) => (
                  <button
                    key={item.href}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(item.href)}
                    className={`flex w-full items-center justify-between gap-sp-3 px-sp-4 py-2.5 text-left text-sm transition ${
                      index === activeIndex ? "bg-coral/10 text-ink" : "text-ink/80"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-ink/40">{item.groupTitle}</span>
                    {item.badge > 0 && (
                      <span className="shrink-0 rounded-full bg-coral px-[7px] py-px font-mono text-[10px] font-bold text-white">{item.badge}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
