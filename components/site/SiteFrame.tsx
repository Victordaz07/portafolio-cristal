import type { ReactNode } from "react";
import { STYLES, designVars, type Design, type StyleDef } from "@/lib/design";

/** Aplica el diseño del Estudio (colores, tipografías, bordes) y el fondo elegido a una página pública. */
export default function SiteFrame({ design, children }: { design: Design; children: ReactNode }) {
  const style: StyleDef = STYLES[design.style];
  return (
    <div style={designVars(design) as React.CSSProperties} className="site relative isolate min-h-screen bg-cream font-sans text-ink">
      {design.background === "textura" && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 -z-10 bg-[url('/images/pattern-bg.webp')] bg-repeat print:hidden ${style.dark ? "opacity-[0.07] invert" : "opacity-25"}`}
        />
      )}
      {design.background === "degradado" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_50%_at_50%_0%,rgb(var(--accent-light)/0.40),transparent_70%),radial-gradient(ellipse_70%_40%_at_100%_100%,rgb(var(--accent)/0.18),transparent_70%)] print:hidden"
        />
      )}
      {children}
    </div>
  );
}
