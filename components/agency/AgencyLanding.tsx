import Link from "next/link";
import { prismaRoot } from "@/lib/prisma-root";
import { MailIcon, WhatsAppIcon, SparkleIcon } from "@/components/icons";
import ServiceCard from "@/components/ServiceCard";

export interface AgencyLandingProps {
  agency: { id: string; name: string; slug: string };
  settings: {
    tagline: string;
    description: string;
    logoUrl: string | null;
    contactEmail: string | null;
    contactWhatsapp: string | null;
    services: unknown;
    showcaseCreatorIds: string[];
  } | null;
}

interface ServiceItem {
  title: string;
  description: string;
  icon?: string;
}

function parseServices(raw: unknown): ServiceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is ServiceItem => Boolean(s && typeof s === "object" && "title" in s && "description" in s));
}

/**
 * Landing pública de una agencia (plan Crew): qué hace, a quién administra y cómo contactarla.
 * No es un portafolio — una agencia no tiene uno propio (ver docs del plan Crew). El login de su
 * equipo y de sus clientes se hace desde el botón "Entrar", que lleva a /admin/login?agencia=<slug>
 * (el panel vive siempre en el host de la plataforma; ver nota en middleware.ts/panelHost()).
 */
export default async function AgencyLanding({ agency, settings }: AgencyLandingProps) {
  const services = parseServices(settings?.services);
  const showcase = settings?.showcaseCreatorIds?.length
    ? await prismaRoot.creator.findMany({
        where: { id: { in: settings.showcaseCreatorIds }, status: "active" },
        select: { id: true, name: true, slug: true, hero: { select: { niche: true, photoUrl: true } } },
      })
    : [];

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="flex items-center justify-between px-sp-4 py-sp-4 md:px-sp-6">
        <div className="flex items-center gap-sp-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {settings?.logoUrl ? <img src={settings.logoUrl} alt={agency.name} className="h-9 w-auto" /> : <span className="font-fraunces italic text-xl font-semibold">{agency.name}</span>}
        </div>
        <Link
          href={`/admin/login?agencia=${agency.slug}`}
          className="r-sm border border-ink/15 px-sp-4 py-sp-2 text-sm font-medium hover:border-coral hover:text-coral"
        >
          Entrar
        </Link>
      </header>

      <section className="px-sp-4 py-sp-8 md:px-sp-6 md:py-sp-10">
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-3">Agencia Foliocrew</p>
        <h1 className="font-fraunces italic font-semibold text-3xl md:text-5xl max-w-2xl mb-sp-4">{settings?.tagline || agency.name}</h1>
        {settings?.description && <p className="max-w-xl text-base text-ink/70">{settings.description}</p>}
      </section>

      {services.length > 0 && (
        <section className="px-sp-4 py-sp-6 md:px-sp-6">
          <h2 className="site-heading text-xl mb-sp-4">Qué hacemos</h2>
          <div className="grid grid-cols-2 gap-sp-4 md:grid-cols-4">
            {services.map((service, i) => (
              <ServiceCard key={i} icon={service.icon || "sparkle"} title={service.title} description={service.description} />
            ))}
          </div>
        </section>
      )}

      {showcase.length > 0 && (
        <section className="px-sp-4 py-sp-6 md:px-sp-6">
          <h2 className="site-heading text-xl mb-sp-4">A quiénes administramos</h2>
          <div className="grid grid-cols-2 gap-sp-4 md:grid-cols-4">
            {showcase.map((creator) => (
              <div key={creator.id} className="r-md border border-line bg-surface p-sp-4 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {creator.hero?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creator.hero.photoUrl} alt={creator.name} className="mx-auto mb-sp-2 h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="mx-auto mb-sp-2 flex h-16 w-16 items-center justify-center rounded-full bg-lime/25 text-coral">
                    <SparkleIcon className="h-6 w-6" />
                  </span>
                )}
                <p className="site-title text-sm">{creator.name}</p>
                {creator.hero?.niche && <p className="text-xs text-ink/60">{creator.hero.niche}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {(settings?.contactEmail || settings?.contactWhatsapp) && (
        <section className="px-sp-4 py-sp-8 md:px-sp-6">
          <h2 className="site-heading text-xl mb-sp-4">Hablemos</h2>
          <div className="flex flex-wrap gap-sp-3">
            {settings.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className="r-sm inline-flex items-center gap-sp-2 border border-ink/15 px-sp-4 py-sp-2 text-sm hover:border-coral hover:text-coral">
                <MailIcon className="h-4 w-4" /> {settings.contactEmail}
              </a>
            )}
            {settings.contactWhatsapp && (
              <a href={`https://wa.me/${settings.contactWhatsapp.replace(/\D/g, "")}`} className="r-sm inline-flex items-center gap-sp-2 border border-ink/15 px-sp-4 py-sp-2 text-sm hover:border-coral hover:text-coral">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </section>
      )}

      <footer className="px-sp-4 py-sp-6 text-center text-xs text-ink/50 md:px-sp-6">
        Hecho con{" "}
        <a href="https://foliocrew.pro" className="font-semibold text-ink/70 hover:text-coral">
          Foliocrew
        </a>
      </footer>
    </main>
  );
}
