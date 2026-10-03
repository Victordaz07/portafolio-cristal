import type { ReactNode } from "react";
import { STYLES, designVars, type Design, type StyleDef } from "@/lib/design";
import { LINK_PATTERNS, PATTERN_IMAGE_OPACITY, PATTERN_TILE, isLinkPattern, patternImage } from "@/lib/bio-links";

const TEXTURE_MASK = "url('/images/pattern-mask.webp')";

/** Aplica el diseño del Estudio (colores, tipografías, bordes) y el fondo elegido a una página pública. */
export default function SiteFrame({ design, children }: { design: Design; children: ReactNode }) {
  const style: StyleDef = STYLES[design.style];
  const bg = design.background;
  // Fondos botánicos: la imagen pintada en el color del acento (presets) o el patrón SVG teñido (color propio / estilo oscuro).
  const botanical = isLinkPattern(bg) ? LINK_PATTERNS[bg] : null;
  const image = isLinkPattern(bg) ? patternImage(bg, design.accent, { dark: style.dark }) : null;
  const layer = "pointer-events-none fixed inset-0 -z-10 print:hidden";
  return (
    <div style={designVars(design) as React.CSSProperties} className="site relative isolate min-h-screen bg-cream font-sans text-ink">
      {bg === "textura" && (
        // Las estrellitas originales, ahora como máscara: se pintan con el color de acento.
        <div
          aria-hidden="true"
          className={`${layer} bg-coral ${style.dark ? "opacity-[0.12]" : "opacity-[0.28]"}`}
          style={{ maskImage: TEXTURE_MASK, WebkitMaskImage: TEXTURE_MASK, maskRepeat: "repeat", WebkitMaskRepeat: "repeat" }}
        />
      )}
      {bg === "degradado" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_50%_at_50%_0%,rgb(var(--accent-light)/0.40),transparent_70%),radial-gradient(ellipse_70%_40%_at_100%_100%,rgb(var(--accent)/0.18),transparent_70%)] print:hidden"
        />
      )}
      {image && (
        <div
          aria-hidden="true"
          className={`${layer} bg-repeat`}
          style={{ backgroundImage: `url(${image})`, backgroundSize: `${PATTERN_TILE}px ${PATTERN_TILE}px`, opacity: PATTERN_IMAGE_OPACITY * 1.6 }}
        />
      )}
      {!image && botanical?.mask && (
        <div
          aria-hidden="true"
          className={`${layer} bg-coral opacity-[0.15]`}
          style={{ maskImage: botanical.mask, WebkitMaskImage: botanical.mask, maskSize: `${botanical.size}px`, WebkitMaskSize: `${botanical.size}px` }}
        />
      )}
      {children}
    </div>
  );
}
