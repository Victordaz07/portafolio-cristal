import type { CSSProperties, ReactNode } from "react";
import { LINK_PATTERNS, PATTERN_IMAGE_OPACITY, PATTERN_TILE, patternImage, type LinkIconKind, type LinkPatternId } from "@/lib/bio-links";
import { InstagramIcon, MailIcon, SparkleIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { safeHref } from "@/lib/validators";

// Piezas de la página "link en bio" (/enlaces), según el diseño "Crislia Links".
// Un solo acento (el del Estudio de diseño) tiñe el anillo del avatar, la flecha del hero, la etiqueta "PORTAFOLIO",
// las pills, el borde al pasar el mouse y el ES/EN activo. El texto principal usa el color "moss" del estilo (cobalt).
// Las animaciones de entrada van en un contenedor (.fc-rise) y las de hover/toque en el enlace, para que no choquen.

/** Entrada escalonada: las tarjetas empiezan a los 300ms y cada una 60ms después de la anterior. */
export const riseDelay = (index: number) => ({ "--delay": `${300 + index * 60}ms` }) as CSSProperties;
export const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

const NOISE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>"
)}")`;

/** Fondo: blobs difuminados (acento claro + oliva) o un patrón teñido del acento, y un grano muy sutil encima. */
export function LinksBackground({ pattern, accent, dark = false }: { pattern: LinkPatternId; accent: string; dark?: boolean }) {
  const p = LINK_PATTERNS[pattern];
  const image = patternImage(pattern, accent, { dark });
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {image ? (
        <div
          className="absolute inset-0 bg-repeat"
          style={{ backgroundImage: `url(${image})`, backgroundSize: `${PATTERN_TILE}px ${PATTERN_TILE}px`, opacity: PATTERN_IMAGE_OPACITY }}
        />
      ) : p.mask ? (
        <div
          className="absolute inset-0 bg-coral opacity-[0.15]"
          style={{ maskImage: p.mask, WebkitMaskImage: p.mask, maskSize: `${p.size}px`, WebkitMaskSize: `${p.size}px`, maskRepeat: "repeat" }}
        />
      ) : (
        <>
          <div className="absolute -left-[90px] -top-[70px] h-[240px] w-[240px] rounded-full bg-lime opacity-45 blur-[55px] sm:-left-[100px] sm:-top-[120px] sm:h-[380px] sm:w-[380px] sm:opacity-40 sm:blur-[80px]" />
          <div className="absolute -right-[80px] bottom-[60px] h-[260px] w-[260px] rounded-full bg-sage opacity-35 blur-[60px] sm:-bottom-[80px] sm:-right-[120px] sm:h-[420px] sm:w-[420px] sm:blur-[90px]" />
        </>
      )}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply" style={{ backgroundImage: NOISE }} />
    </div>
  );
}

export function Avatar({ src, alt, fallback }: { src: string | null; alt: string; fallback: string }) {
  return (
    <span className="inline-flex h-[84px] w-[84px] shrink-0 rounded-full bg-[linear-gradient(135deg,rgb(var(--ring-from)),rgb(var(--ring-to)))] p-[3px] sm:h-[92px] sm:w-[92px]">
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

/** Nombre con la segunda palabra en cursiva y en el acento ("Cristal *Amalia* Flores Bello"). */
export function DisplayName({ name }: { name: string }) {
  const words = name.trim().split(/\s+/);
  return (
    <h1 className="text-center font-fraunces text-[19px] font-semibold leading-tight text-cobalt sm:text-[21px]">
      {words.map((w, i) => (
        <span key={i}>
          {i > 0 && " "}
          {i === 1 ? <span className="font-medium italic text-coral">{w}</span> : w}
        </span>
      ))}
    </h1>
  );
}

export function SocialRow({ items }: { items: { icon: ReactNode; href: string; label: string }[] }) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-[10px]">
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={safeHref(item.href)}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-cobalt/[0.12] bg-surface text-cobalt transition duration-150 hover:-translate-y-0.5 hover:bg-lime/20 active:scale-[0.92] sm:h-10 sm:w-10"
          >
            {item.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function HeroCard({ eyebrow, title, bgSrc, href }: { eyebrow: string; title: string; bgSrc: string | null; href: string }) {
  return (
    <a
      href={safeHref(href)}
      className="r-24 fc-shimmer relative block h-[168px] w-full overflow-hidden bg-cobalt shadow-fc-hero transition-transform active:scale-[0.98] sm:h-[180px]"
    >
      {bgSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bgSrc} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-[center_25%]" />
      )}
      <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(36,18,39,0.82)_10%,rgba(36,18,39,0.1)_65%)]" />
      <span className="absolute inset-x-[18px] bottom-4 sm:inset-x-5 sm:bottom-[18px]">
        <span className="site-title mb-1 block text-[10.5px] uppercase tracking-[0.1em] text-lime sm:text-[11px]">{eyebrow}</span>
        <span className="flex items-center justify-between gap-[10px]">
          <span className="font-fraunces text-lg font-semibold text-white sm:text-xl">{title}</span>
          <span aria-hidden="true" className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white text-[15px] text-moss sm:h-9 sm:w-9 sm:text-base">
            →
          </span>
        </span>
      </span>
    </a>
  );
}

function Wave() {
  return (
    <svg aria-hidden="true" className="h-[6px] flex-1 text-cobalt/25" viewBox="0 0 100 6" preserveAspectRatio="none">
      <path d="M0 3 Q10 0 20 3 T40 3 T60 3 T80 3 T100 3" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mb-[10px] flex items-center gap-[10px]">
      <Wave />
      <h2 className="site-title whitespace-nowrap text-[11.5px] tracking-[0.04em] text-cobalt sm:text-xs">{label}</h2>
      <Wave />
    </div>
  );
}

const PaypalIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
    <rect x="2" y="6" width="20" height="13" rx="3" />
    <path d="M2 10h20M6 15h4" />
  </svg>
);
const ShopIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
    <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

/** Ícono según el tipo de enlace cuando no hay imagen (PayPal, redes, correo, tienda…). */
export function KindIcon({ kind, large = false }: { kind: LinkIconKind; large?: boolean }) {
  const size = large ? "h-[22px] w-[22px] sm:h-6 sm:w-6" : "h-4 w-4";
  if (kind === "social")
    return (
      <span className="flex items-center gap-[3px]">
        <TikTokIcon className={large ? "h-4 w-4" : "h-3 w-3"} />
        <InstagramIcon className={large ? "h-4 w-4" : "h-3 w-3"} />
      </span>
    );
  if (kind === "paypal") return <PaypalIcon className={size} />;
  if (kind === "mail") return <MailIcon className={size} />;
  if (kind === "whatsapp") return <WhatsAppIcon className={size} />;
  if (kind === "shop") return <ShopIcon className={size} />;
  return <SparkleIcon className={size} />;
}

export interface LinkItem {
  key: string;
  id?: string; // enlaces propios: se cuentan los clics
  variant: "row" | "card";
  title: string;
  href: string;
  external?: boolean;
  thumbSrc?: string | null;
  icon?: ReactNode;
  pill?: string | null;
  kicker?: string | null;
  badge?: string | null;
  span?: 1 | 2;
  hidden?: boolean;
}

const surface =
  "border border-cobalt/10 bg-surface shadow-fc-card transition duration-150 hover:-translate-y-0.5 hover:border-coral/30 active:scale-[0.97]";

export function LinkTile({ item, style, editTarget, ghost = false }: { item: LinkItem; style: CSSProperties; editTarget?: string; ghost?: boolean }) {
  const span = item.span ?? (item.variant === "row" ? 2 : 1);
  const target = item.external === false ? {} : { target: "_blank", rel: "noreferrer" };
  return (
    // content-visibility: las tarjetas fuera de la pantalla no se dibujan hasta que llegas a ellas.
    <div
      className={`fc-rise [content-visibility:auto] ${item.variant === "row" ? "[contain-intrinsic-size:auto_66px]" : "[contain-intrinsic-size:auto_150px]"} ${span === 2 ? "col-span-2" : "col-span-1"} ${ghost ? "opacity-40 [filter:grayscale(0.6)]" : ""}`}
      style={style}
      {...(editTarget ? { "data-edit": editTarget } : {})}
    >
      {item.variant === "row" ? (
        <a
          href={safeHref(item.href)}
          {...target}
          data-link-id={item.id}
          className={`r-16 flex min-h-[62px] items-center gap-[10px] px-3 py-[9px] hover:bg-cream/60 sm:min-h-[66px] sm:gap-3 sm:px-[14px] sm:py-[10px] ${surface}`}
        >
          <span className="r-12 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-lime/20 text-cobalt sm:h-[42px] sm:w-[42px]">
            {item.thumbSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={item.thumbSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              item.icon
            )}
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-cobalt sm:text-[13.5px]">{item.title}</span>
          {item.badge && (
            <span className="shrink-0 rounded-full bg-moss px-2 py-[3px] text-[9px] font-bold text-white sm:text-[9.5px]">{item.badge}</span>
          )}
          {item.pill && !item.badge && (
            <span className="shrink-0 rounded-full bg-cream px-2 py-[3px] text-[9.5px] font-bold text-moss ring-1 ring-coral/25">{item.pill}</span>
          )}
        </a>
      ) : (
        <a href={safeHref(item.href)} {...target} data-link-id={item.id} className={`r-16 relative flex h-full flex-col overflow-hidden ${surface}`}>
          {item.badge && (
            <span className="absolute left-1.5 top-1.5 z-[1] max-w-[60%] truncate rounded-full bg-moss px-[7px] py-[3px] text-[9px] font-bold text-white">{item.badge}</span>
          )}
          {item.pill && (
            <span className="absolute right-1.5 top-1.5 z-[1] max-w-[60%] truncate rounded-full bg-white/95 px-[7px] py-[3px] text-[9.5px] font-bold text-[rgb(var(--accent-deep,var(--accent-dark)))] sm:right-[7px] sm:top-[7px] sm:text-[10px]">
              {item.pill}
            </span>
          )}
          {item.thumbSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={item.thumbSrc} alt="" className="h-[76px] w-full object-cover sm:h-[84px]" />
          ) : (
            <span className="flex h-[76px] w-full items-center justify-center bg-sage/20 text-cobalt sm:h-[84px]">{item.icon}</span>
          )}
          <span className="block px-1.5 py-2 text-center sm:px-2 sm:py-[9px]">
            {item.kicker && <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-[0.04em] text-moss sm:text-[9.5px]">{item.kicker}</span>}
            <span className="line-clamp-2 text-xs font-semibold leading-[1.3] text-cobalt sm:text-[13px]">{item.title}</span>
          </span>
        </a>
      )}
    </div>
  );
}
