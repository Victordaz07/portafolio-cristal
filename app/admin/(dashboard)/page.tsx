import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import Badge from "@/components/admin/Badge";
import {
  SparkleIcon,
  ChartIcon,
  MenuIcon as FeedIcon,
  TagIcon,
  QuestionIcon,
  InboxIcon,
} from "@/components/icons";

export default async function AdminHomePage() {
  const [stats, contentCards, brands, faqItems, recentMessages, unreadMessages] =
    await Promise.all([
      prisma.stat.count(),
      prisma.contentCard.count(),
      prisma.brand.count({ where: { active: true } }),
      prisma.faqItem.count(),
      prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
      prisma.contactMessage.count({ where: { read: false } }),
    ]);

  const cards = [
    { label: "Stats en media kit", value: stats, href: "/admin/media-kit", icon: ChartIcon },
    { label: "Tarjetas en el feed", value: contentCards, href: "/admin/feed", icon: FeedIcon },
    { label: "Marcas activas", value: brands, href: "/admin/marcas", icon: TagIcon },
    { label: "Preguntas FAQ", value: faqItems, href: "/admin/faq", icon: QuestionIcon },
    {
      label: "Mensajes sin leer",
      value: unreadMessages,
      href: "/admin/mensajes",
      icon: InboxIcon,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Panel privado"
        title="Panel de administración"
        description="Bienvenida, Crislia. Edita tu sitio desde aquí."
      />

      <div className="grid gap-sp-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="flex items-center gap-sp-4 transition hover:-translate-y-0.5 hover:border-coral/30 hover:shadow-[0_8px_24px_rgba(36,18,39,0.08)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime/25 text-coral">
                <card.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-2xl font-bold text-moss">{card.value}</p>
                <p className="mt-1 text-sm text-ink/70">{card.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-sp-8 flex items-center justify-between">
        <h2 className="font-bodoni italic font-bold uppercase text-lg text-ink flex items-center gap-sp-2">
          <SparkleIcon className="h-4 w-4 text-moss" />
          Últimos mensajes
        </h2>
        <Link href="/admin/mensajes" className="text-sm font-medium text-coral hover:underline">
          Ver todos
        </Link>
      </div>

      <div className="mt-sp-4 flex flex-col gap-sp-3">
        {recentMessages.length === 0 && (
          <Card className="text-sm text-ink/60">Todavía no has recibido mensajes.</Card>
        )}
        {recentMessages.map((message) => (
          <Link key={message.id} href="/admin/mensajes">
            <Card className="flex items-center justify-between gap-sp-4 transition hover:border-coral/30">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">
                  {message.name} — {message.brand}
                </p>
                <p className="truncate text-sm text-ink/60">{message.message}</p>
              </div>
              {!message.read && <Badge variant="new">Nuevo</Badge>}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
