import type { CSSProperties, ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";

// Piezas de la página "link en bio" (/enlaces), según el handoff de diseño.
// Un solo acento (el del Estudio de diseño) tiñe el anillo del avatar, la flecha del hero,
// la etiqueta "PORTAFOLIO", las pills, el borde al pasar el mouse y el ES/EN activo.

/** Entrada escalonada: el contenido aparece 300ms después del hero y cada tarjeta 60ms después de la anterior. */
export const riseDelay = (index: number) => ({ "--delay": `${300 + index * 60}ms` }) as CSSProperties;

export function Avatar({ src, alt, size = 92, fallback }: { src: string | null; alt: string; size?: 84 | 92; fallback: string }) {
  return (
    <span className="inline-flex rounded-full bg-gradient-to-br from-lime to-coral p-[3px] shadow-fc-card" style={{ width: size, height: size }}>
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[3px] border-cream bg-cream">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <span className="font-fraunces text-3xl font-semibold text-coral">{fallback}</span>
        )}
      </span>
    </span>
  );
}

export function SocialRow({ items }: { items: { icon: ReactNode; href: string; label: string }[] }) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-sp-2">
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            className="fc-press flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink/75 shadow-fc-card transition-colors hover:border-coral hover:text-coral"
          >
            {item.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Pill({ label, onImage = false }: { label: string; onImage?: boolean }) {
  return (
    <span
      // Sobre una foto la pill es blanca: el texto usa el acento oscuro original (también en estilos oscuros).
      className={`inline-block max-w-full shrink-0 truncate rounded-full px-sp-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${
        onImage ? "bg-white/90 text-[rgb(var(--accent-deep,var(--accent-dark)))]" : "bg-surface text-moss ring-1 ring-coral/30"
      }`}
    >
      {label}
    </span>
  );
}

export function HeroCard({ eyebrow, title, bgSrc, href, shimmer = true }: { eyebrow: string; title: string; bgSrc: string | null; href: string; shimmer?: boolean }) {
  return (
    <a
      href={href}
      className={`fc-press r-24 group relative flex min-h-[176px] items-end overflow-hidden bg-cobalt p-sp-5 shadow-fc-hero ${shimmer ? "fc-shimmer" : ""}`}
    >
      {bgSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bgSrc} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
      )}
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
      <span className="relative flex w-full items-end justify-between gap-sp-3">
        <span>
          <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-lime">{eyebrow}</span>
          <span className="mt-1 block font-fraunces text-2xl font-semibold leading-tight text-white">{title}</span>
        </span>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral text-white transition group-hover:translate-x-0.5">
          <ArrowRightIcon className="h-5 w-5" />
        </span>
      </span>
    </a>
  );
}

export function SectionDivider({ label, style }: { label: string; style?: CSSProperties }) {
  return (
    <div className="fc-rise col-span-2 flex items-center gap-sp-3 pt-sp-3" style={style}>
      <span className="h-px flex-1 bg-coral/30" />
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/55">{label}</span>
      <span className="h-px flex-1 bg-coral/30" />
    </div>
  );
}

export interface LinkCardProps {
  variant: "row" | "card";
  title: string;
  href: string;
  thumbSrc?: string | null;
  icon?: ReactNode;
  pill?: string | null;
  span?: 1 | 2;
  delay: CSSProperties;
  external?: boolean;
}

export function LinkCard({ variant, title, href, thumbSrc, icon, pill, span = variant === "row" ? 2 : 1, delay, external = true }: LinkCardProps) {
  const target = external ? { target: "_blank", rel: "noreferrer" } : {};
  return (
    <div className={`fc-rise ${span === 2 ? "col-span-2" : "col-span-1"}`} style={delay}>
      {variant === "row" ? (
        <a
          href={href}
          {...target}
          className="fc-press r-16 flex min-h-[64px] items-center gap-sp-3 border border-line bg-surface p-sp-2 pr-sp-4 shadow-fc-card transition-colors hover:border-coral"
        >
          <span className="r-12 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-lime/25 text-coral">
            {thumbSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              icon
            )}
          </span>
          <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-ink">{title}</span>
          {pill && <Pill label={pill} />}
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-ink/35" />
        </a>
      ) : (
        <a href={href} {...target} className="fc-press r-16 group flex h-full flex-col overflow-hidden border border-line bg-surface shadow-fc-card transition-colors hover:border-coral">
          <span className="relative block aspect-[4/5] overflow-hidden bg-lime/25">
            {thumbSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbSrc} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-coral">{icon}</span>
            )}
            {pill && (
              <span className="absolute left-sp-2 right-sp-2 top-sp-2 flex">
                <Pill label={pill} onImage />
              </span>
            )}
          </span>
          <span className="block p-sp-3">
            <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{title}</span>
          </span>
        </a>
      )}
    </div>
  );
}
