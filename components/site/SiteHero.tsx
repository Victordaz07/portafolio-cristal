import type { ReactNode } from "react";
import HeroStat from "@/components/HeroStat";
import HeroStatCard from "@/components/HeroStatCard";
import MobileHeroNav from "@/components/MobileHeroNav";
import DesktopBrandMark from "@/components/DesktopBrandMark";
import LocaleToggle from "@/components/LocaleToggle";
import MotivationTrigger from "@/components/MotivationTrigger";
import { SparkleIcon, ArrowRightIcon, STAT_ICONS, StarIcon, type StatIconKey } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import type { HeroId } from "@/lib/design";

// Portada del sitio público con los 4 diseños del Estudio de diseño.
// "split" es la portada original (texto a la izquierda, foto a la derecha).

export interface SiteHeroProps {
  layout: HeroId;
  locale: Locale;
  name: string;
  firstName: string;
  navLinks: { href: string; label: string }[];
  badge: string;
  headline: { plain: string; emphasis: string; suffix: string };
  description: string;
  descriptionNode: ReactNode;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  photo: string;
  photoMobile: string;
  stats: { id: string; value: string; label: string; icon: string }[];
}

function DesktopNav({ firstName, locale, navLinks, light = false }: Pick<SiteHeroProps, "firstName" | "locale" | "navLinks"> & { light?: boolean }) {
  const chip = light ? "border-white/30 bg-black/25 text-white" : "border-line bg-cream/70 text-ink/80";
  return (
    <div className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-content items-center justify-between gap-sp-3 px-sp-5 py-sp-5 lg:px-sp-8">
        <span className={light ? "text-white" : undefined}>
          <DesktopBrandMark name={firstName} locale={locale} />
        </span>
        <div className="flex items-center gap-sp-3">
          <ul className={`flex gap-sp-5 rounded-full border px-sp-5 py-sp-2 font-mono text-[11px] uppercase tracking-wide backdrop-blur-sm ${chip}`}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition hover:text-coral">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <LocaleToggle
            locale={locale}
            className={`rounded-full border px-sp-3 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur-sm transition hover:border-coral hover:text-coral ${chip}`}
          />
        </div>
      </div>
    </div>
  );
}

function Badge({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-sp-2 rounded-full border px-sp-4 py-sp-2 font-mono text-[11px] uppercase tracking-widest ${
        light ? "border-white/40 text-white/90" : "border-line text-ink/80"
      }`}
    >
      <SparkleIcon className="h-3.5 w-3.5 text-lime" />
      {text}
    </span>
  );
}

function Divider({ locale, center = false }: { locale: Locale; center?: boolean }) {
  return (
    <MotivationTrigger locale={locale} ariaLabel="Decoración" className={`flex items-center gap-sp-3 ${center ? "w-full justify-center" : ""}`}>
      <span className="h-px w-14 bg-lime/60" />
      <SparkleIcon className="h-3 w-3 shrink-0 text-lime" />
      <span className={`h-px ${center ? "w-14 bg-lime/60" : "w-24 bg-gradient-to-r from-lime/60 to-transparent"}`} />
    </MotivationTrigger>
  );
}

function Ctas({ primary, secondary, light = false, stretch = false }: Pick<SiteHeroProps, "primary" | "secondary"> & { light?: boolean; stretch?: boolean }) {
  const size = stretch ? "flex-1 justify-center px-sp-4 text-sm" : "px-sp-6";
  return (
    <div className={`flex gap-sp-3 ${stretch ? "" : "flex-wrap"}`}>
      <a
        href={primary.href}
        className={`r-btn inline-flex items-center gap-sp-2 border py-sp-3 font-medium transition ${size} ${
          light ? "border-white/70 text-white hover:bg-white hover:text-ink" : "border-cobalt text-cobalt hover:bg-cobalt hover:text-cream"
        }`}
      >
        {primary.label}
        <ArrowRightIcon className="h-4 w-4" />
      </a>
      <a
        href={secondary.href}
        className={`r-btn inline-flex items-center gap-sp-2 py-sp-3 font-medium transition hover:opacity-90 ${size} ${
          light ? "bg-coral text-white" : "bg-cobalt text-cream"
        }`}
      >
        {secondary.label}
        <SparkleIcon className="h-4 w-4" />
      </a>
    </div>
  );
}

function StatsRow({ stats }: Pick<SiteHeroProps, "stats">) {
  if (!stats.length) return null;
  return (
    <div id="media-kit" className="grid grid-cols-2 gap-sp-5 border-t border-line pt-sp-6 sm:grid-cols-3">
      {stats.map((stat) => (
        <HeroStat key={stat.id} value={stat.value} label={stat.label} icon={stat.icon} />
      ))}
    </div>
  );
}

function StatsCards({ stats }: Pick<SiteHeroProps, "stats">) {
  if (!stats.length) return null;
  return (
    <div className="grid grid-cols-3 gap-sp-3">
      {stats.map((stat) => (
        <HeroStatCard key={stat.id} value={stat.value} label={stat.label} icon={stat.icon} />
      ))}
    </div>
  );
}

/** Cifras en blanco sobre la foto (portada "Foto de fondo"). */
function StatsLight({ stats }: Pick<SiteHeroProps, "stats">) {
  if (!stats.length) return null;
  return (
    <div id="media-kit" className="grid grid-cols-3 gap-sp-4 border-t border-white/25 pt-sp-5">
      {stats.map((stat) => {
        const Icon = STAT_ICONS[stat.icon as StatIconKey] ?? StarIcon;
        return (
          <div key={stat.id}>
            <Icon className="h-4 w-4 text-lime" />
            <p className="mt-sp-2 font-mono text-lg font-bold text-white md:text-xl">{stat.value}</p>
            <p className="mt-1 text-[10px] uppercase leading-tight tracking-wide text-white/70 md:text-[11px]">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function SiteHero(props: SiteHeroProps) {
  switch (props.layout) {
    case "cover":
      return <CoverHero {...props} />;
    case "centered":
      return <CenteredHero {...props} />;
    case "magazine":
      return <MagazineHero {...props} />;
    default:
      return <SplitHero {...props} />;
  }
}

/** Original: móvil con foto arriba y tarjeta encima; escritorio en 2 columnas. */
function SplitHero(p: SiteHeroProps) {
  return (
    <section id="about" className="relative overflow-hidden bg-cream">
      <div className="md:hidden">
        <div className="relative">
          <MobileHeroNav name={p.firstName} links={p.navLinks} locale={p.locale} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.photoMobile} alt={p.name} className="aspect-square w-full object-cover object-bottom" />
          <div className="relative -mt-10 rounded-t-3xl bg-cream px-sp-5 pb-sp-3 pt-sp-7 text-center">
            <Badge text={p.badge} />
            <h1 className="mt-sp-5 font-fraunces text-[clamp(2rem,8vw,2.6rem)] font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
              {p.headline.plain} {p.headline.emphasis} {p.headline.suffix}
            </h1>
            <div className="mt-sp-4">
              <Divider locale={p.locale} center />
            </div>
            <p className="mt-sp-4 font-sans text-sm leading-relaxed text-ink/75">{p.description}</p>
            <div className="mt-sp-6">
              <Ctas primary={p.primary} secondary={p.secondary} stretch />
            </div>
            {p.stats.length > 0 && (
              <div className="mt-sp-6">
                <StatsCards stats={p.stats} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative hidden md:block">
        <DesktopNav firstName={p.firstName} locale={p.locale} navLinks={p.navLinks} />
        <div className="grid md:grid-cols-2 md:items-stretch">
          <div className="flex items-center pb-sp-9 pt-[136px] lg:pt-[128px]">
            <div className="mx-auto w-full max-w-xl px-sp-5 lg:pl-sp-8 lg:pr-sp-6">
              <Badge text={p.badge} />
              <h1 className="mt-sp-5 font-fraunces text-[clamp(2.2rem,4.4vw,3.6rem)] font-semibold leading-[1.08] tracking-[-0.01em] text-ink">
                {p.headline.plain}
                <br />
                <em className="font-fraunces not-italic text-lime">{p.headline.emphasis}</em> {p.headline.suffix}
              </h1>
              <div className="mt-sp-5">
                <Divider locale={p.locale} />
              </div>
              <p className="mt-sp-5 font-sans leading-relaxed text-ink/75">{p.descriptionNode}</p>
              <div className="mt-sp-6">
                <Ctas primary={p.primary} secondary={p.secondary} />
              </div>
              {p.stats.length > 0 && (
                <div className="mt-sp-8">
                  <StatsRow stats={p.stats} />
                </div>
              )}
            </div>
          </div>
          <div className="relative min-h-[560px] lg:min-h-[640px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.photo} alt={p.name} className="absolute inset-0 h-full w-full object-cover object-right" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** La foto ocupa toda la portada; el texto va encima con un velo oscuro para que siempre se lea. */
function CoverHero(p: SiteHeroProps) {
  return (
    <section id="about" className="relative isolate flex min-h-[92svh] overflow-hidden bg-[#111] md:min-h-[88vh]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.photoMobile} alt={p.name} className="absolute inset-0 -z-10 h-full w-full object-cover md:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.photo} alt="" aria-hidden="true" className="absolute inset-0 -z-10 hidden h-full w-full object-cover md:block" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-black/20 md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-black/5" />

      <div className="md:hidden">
        <MobileHeroNav name={p.firstName} links={p.navLinks} locale={p.locale} tone="light" />
      </div>
      <div className="hidden md:block">
        <DesktopNav firstName={p.firstName} locale={p.locale} navLinks={p.navLinks} light />
      </div>

      <div className="relative mx-auto mt-auto w-full max-w-content px-sp-5 pb-sp-7 pt-[120px] md:pb-sp-9 lg:px-sp-8">
        <div className="max-w-2xl">
          <Badge text={p.badge} light />
          <h1 className="mt-sp-5 font-fraunces text-[clamp(2.3rem,6vw,4.4rem)] font-semibold leading-[1.05] tracking-[-0.015em] text-white">
            {p.headline.plain} <em className="font-fraunces not-italic text-lime">{p.headline.emphasis}</em> {p.headline.suffix}
          </h1>
          <p className="mt-sp-5 max-w-xl font-sans leading-relaxed text-white/85">{p.description}</p>
          <div className="mt-sp-6">
            <Ctas primary={p.primary} secondary={p.secondary} light />
          </div>
          {p.stats.length > 0 && (
            <div className="mt-sp-7 max-w-lg">
              <StatsLight stats={p.stats} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Foto en círculo y todo centrado. */
function CenteredHero(p: SiteHeroProps) {
  return (
    <section id="about" className="relative overflow-hidden bg-cream">
      <div className="relative h-16 md:hidden">
        <MobileHeroNav name={p.firstName} links={p.navLinks} locale={p.locale} />
      </div>
      <div className="hidden md:block">
        <DesktopNav firstName={p.firstName} locale={p.locale} navLinks={p.navLinks} />
      </div>
      <div className="mx-auto flex max-w-3xl flex-col items-center px-sp-5 pb-sp-8 pt-sp-4 text-center md:pb-sp-9 md:pt-[132px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.photoMobile}
          alt={p.name}
          className="h-40 w-40 rounded-full object-cover ring-4 ring-lime/70 ring-offset-4 ring-offset-cream md:h-52 md:w-52"
        />
        <div className="mt-sp-6">
          <Badge text={p.badge} />
        </div>
        <h1 className="mt-sp-5 font-fraunces text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-ink">
          {p.headline.plain} <em className="font-fraunces not-italic text-coral">{p.headline.emphasis}</em> {p.headline.suffix}
        </h1>
        <div className="mt-sp-5 w-full">
          <Divider locale={p.locale} center />
        </div>
        <p className="mt-sp-5 max-w-xl font-sans leading-relaxed text-ink/75">{p.descriptionNode}</p>
        <div className="mt-sp-6 flex justify-center">
          <Ctas primary={p.primary} secondary={p.secondary} />
        </div>
        {p.stats.length > 0 && (
          <div className="mt-sp-7 w-full max-w-xl">
            <StatsCards stats={p.stats} />
          </div>
        )}
      </div>
    </section>
  );
}

/** Nombre gigante como portada de revista, foto enmarcada y el titular al lado. */
function MagazineHero(p: SiteHeroProps) {
  return (
    <section id="about" className="relative overflow-hidden bg-cream">
      <div className="relative h-16 md:hidden">
        <MobileHeroNav name={p.firstName} links={p.navLinks} locale={p.locale} />
      </div>
      <div className="hidden md:block">
        <DesktopNav firstName={p.firstName} locale={p.locale} navLinks={p.navLinks} />
      </div>
      <div className="mx-auto max-w-content px-sp-5 pb-sp-8 pt-sp-3 md:pb-sp-9 md:pt-[120px] lg:px-sp-8">
        <Badge text={p.badge} />
        <h1 className="mt-sp-4 break-words font-fraunces text-[clamp(3.2rem,12.5vw,9.5rem)] font-semibold uppercase leading-[0.88] tracking-[-0.035em] text-ink">
          {p.name}
        </h1>
        <div className="mt-sp-6 grid items-end gap-sp-7 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="relative mr-sp-3 mb-sp-3">
            <span aria-hidden="true" className="r-lg absolute inset-0 translate-x-sp-3 translate-y-sp-3 border-2 border-coral" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.photo} alt="" aria-hidden="true" className="r-lg relative aspect-[4/5] w-full object-cover" />
          </div>
          <div className="pb-sp-2">
            <p className="font-fraunces text-[clamp(1.6rem,3vw,2.5rem)] font-semibold leading-[1.12] text-ink">
              {p.headline.plain} <em className="font-fraunces not-italic text-coral">{p.headline.emphasis}</em> {p.headline.suffix}
            </p>
            <div className="mt-sp-5">
              <Divider locale={p.locale} />
            </div>
            <p className="mt-sp-5 font-sans leading-relaxed text-ink/75">{p.descriptionNode}</p>
            <div className="mt-sp-6">
              <Ctas primary={p.primary} secondary={p.secondary} />
            </div>
            {p.stats.length > 0 && (
              <div className="mt-sp-7">
                <StatsRow stats={p.stats} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
