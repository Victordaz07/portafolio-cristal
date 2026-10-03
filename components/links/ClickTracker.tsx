"use client";

import { useEffect } from "react";

/** Cuenta los clics en los enlaces propios ([data-link-id]) sin frenar la visita (sendBeacon). */
export default function ClickTracker({ endpoint }: { endpoint: string }) {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-link-id]");
      const id = link?.dataset.linkId;
      if (!id) return;
      const body = new Blob([JSON.stringify({ id })], { type: "application/json" });
      if (!navigator.sendBeacon?.(endpoint, body)) {
        fetch(endpoint, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => null);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [endpoint]);
  return null;
}
