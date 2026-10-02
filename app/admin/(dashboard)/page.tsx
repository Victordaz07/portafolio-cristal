import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";

// Iniciales y color por red, igual que en el diseño del panel v2.
const PLATFORM_META: Record<string, { initials: string; className: string }> = {
  instagram: { initials: "IG", className: "bg-coral text-white" },
  tiktok: { initials: "TK", className: "bg-ink text-white" },
  facebook: { initials: "FB", className: "bg-moss text-white" },
  ugc: { initials: "UGC", className: "bg-lime text-ink" },
};

function timeAgo(date: Date) {
  const hours = Math.floor((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 1) return "hace un momento";
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-sp-3 flex items-center justify-between gap-sp-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{children}</p>
      {aside}
    </div>
  );
}

export default async function AdminHomePage() {
  const [
    contentCards,
    activeBrands,
    unreadMessages,
    reviews,
    testimonials,
    pendingMessages,
    latestCards,
    stats,
    brandsWithContent,
  ] = await Promise.all([
    prisma.contentCard.count(),
    prisma.brand.count({ where: { active: true } }),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.review.count(),
    prisma.testimonial.count(),
    prisma.contactMessage.findMany({
      where: { read: false },
      orderBy: { createdAt: "asc" },
      take: 4,
    }),
    prisma.contentCard.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { brand: { select: { name: true } } },
    }),
    prisma.stat.findMany({ orderBy: { order: "asc" }, take: 3 }),
    prisma.brand.findMany({
      where: { active: true, contentCards: { some: {} } },
      orderBy: { order: "asc" },
      take: 5,
      select: { id: true, name: true, _count: { select: { contentCards: true } } },
    }),
  ]);

  const kpis = [
    { label: "Publicaciones en el feed", value: contentCards, href: "/admin/feed" },
    { label: "Marcas activas", value: activeBrands, href: "/admin/marcas" },
    { label: "Mensajes sin leer", value: unreadMessages, href: "/admin/mensajes" },
    { label: "Reseñas destacadas", value: reviews, href: "/admin/resenas" },
    { label: "Testimonios", value: testimonials, href: "/admin/testimonios" },
  ];

  const quickActions = [
    { label: "+ Nueva publicación", href: "/admin/feed" },
    { label: "+ Agregar marca", href: "/admin/marcas" },
    { label: "Editar portada", href: "/admin/hero" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Resumen" title="Tu panorama general" />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        {kpis.map((kpi) => (
          <Link key={kpi.href} href={kpi.href}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-coral/30 hover:shadow-[0_8px_24px_rgba(36,18,39,0.08)]">
              <p className="font-fraunces text-3xl font-semibold text-coral">{kpi.value}</p>
              <p className="mt-sp-1 text-sm text-ink/70">{kpi.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-sp-5 grid gap-sp-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-sp-4">
          <Card>
            <SectionTitle
              aside={
                unreadMessages > 0 && (
                  <span className="rounded-full bg-coral px-sp-2 py-0.5 font-mono text-[10px] font-bold text-white">
                    {unreadMessages} sin leer
                  </span>
                )
              }
            >
              Mensajes por atender
            </SectionTitle>
            {pendingMessages.length === 0 ? (
              <p className="text-sm text-ink/60">Estás al día: no hay mensajes sin leer.</p>
            ) : (
              <ul className="divide-y divide-line">
                {pendingMessages.map((message) => (
                  <li key={message.id}>
                    <Link
                      href="/admin/mensajes"
                      className="flex items-center justify-between gap-sp-3 py-2.5 hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{message.brand}</p>
                        <p className="truncate text-xs text-ink/60">
                          {message.name} · {message.collaborationType}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-coral/10 px-sp-2 py-0.5 text-[11px] font-semibold text-moss">
                        {timeAgo(message.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle>Últimas publicaciones</SectionTitle>
            {latestCards.length === 0 ? (
              <p className="text-sm text-ink/60">Todavía no hay publicaciones en el feed.</p>
            ) : (
              <ul className="flex flex-col gap-sp-3">
                {latestCards.map((card) => {
                  const meta = PLATFORM_META[card.platform] ?? PLATFORM_META.ugc;
                  return (
                    <li key={card.id}>
                      <Link href="/admin/feed" className="flex items-center gap-sp-3 hover:opacity-80">
                        <span
                          className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] font-mono text-[9px] font-bold ${meta.className}`}
                        >
                          {meta.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{card.caption}</p>
                          {card.brand && (
                            <p className="truncate text-xs text-ink/60">{card.brand.name}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-ink/50">{card.category}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-sp-4">
          <Link
            href="/admin/media-kit"
            className="rounded-[18px] bg-ink p-sp-5 text-cream transition hover:opacity-95"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-lime">
              Tu media kit
            </p>
            {stats.length === 0 ? (
              <p className="mt-sp-3 text-sm text-cream/70">Agrega tus cifras en Media kit.</p>
            ) : (
              <div className="mt-sp-3 grid grid-cols-3 gap-sp-3">
                {stats.map((stat) => (
                  <div key={stat.id}>
                    <p className="font-fraunces text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-0.5 text-xs text-cream/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </Link>

          <Card>
            <SectionTitle>Marcas con contenido</SectionTitle>
            {brandsWithContent.length === 0 ? (
              <p className="text-sm text-ink/60">
                Vincula una marca a una publicación del feed para verla aquí.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {brandsWithContent.map((brand) => (
                  <li key={brand.id} className="flex items-center justify-between gap-sp-3">
                    <span className="truncate text-[13px] font-semibold text-ink">{brand.name}</span>
                    <span className="shrink-0 rounded-full bg-sage/40 px-2.5 py-0.5 text-[11px] font-bold text-cobalt">
                      {brand._count.contentCards}{" "}
                      {brand._count.contentCards === 1 ? "pieza" : "piezas"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle>Acciones rápidas</SectionTitle>
            <div className="flex flex-col gap-2.5">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="rounded-[10px] border border-line px-3.5 py-2.5 text-[13px] text-ink transition hover:border-coral hover:text-coral"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
