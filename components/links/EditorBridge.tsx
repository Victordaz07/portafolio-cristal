"use client";

import { useEffect } from "react";

const SCROLL_KEY = "fc-link-editor-scroll";

/**
 * Solo dentro del editor (/admin/enlaces, iframe con ?editor=1): marca lo que se puede editar, y al tocar un bloque
 * avisa al panel en vez de abrir el enlace. También recuerda el scroll entre recargas de la vista previa.
 */
export default function EditorBridge() {
  useEffect(() => {
    if (window.parent === window) return;
    const style = document.createElement("style");
    style.textContent = `
      [data-edit] { cursor: pointer; outline: 2px dashed transparent; outline-offset: 4px; border-radius: 18px; transition: outline-color .15s; }
      [data-edit]:hover { outline-color: rgb(var(--accent) / 0.55); }
      [data-edit] [data-edit]:hover { outline-color: rgb(var(--accent)); }
      .fc-edit-flash { outline: 2px solid rgb(var(--accent)) !important; }
    `;
    document.head.appendChild(style);

    try {
      const y = Number(sessionStorage.getItem(SCROLL_KEY) || 0);
      if (y) requestAnimationFrame(() => window.scrollTo(0, y));
    } catch {}
    const saveScroll = () => {
      try {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      } catch {}
    };

    function onClick(event: MouseEvent) {
      const el = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-edit]");
      if (!el) return;
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage({ type: "fc-link-edit", target: el.dataset.edit }, window.location.origin);
    }
    // El panel pide mostrar un bloque: se desplaza hasta él y lo resalta un momento.
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== "fc-link-focus") return;
      const el = document.querySelector<HTMLElement>(`[data-edit="${CSS.escape(String(event.data.target))}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("fc-edit-flash");
      setTimeout(() => el.classList.remove("fc-edit-flash"), 1200);
    }
    document.addEventListener("click", onClick, true);
    window.addEventListener("message", onMessage);
    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("scroll", saveScroll);
      style.remove();
    };
  }, []);
  return null;
}
