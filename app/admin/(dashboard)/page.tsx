import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const [stats, contentCards, brands, faqItems, unreadMessages] =
    await Promise.all([
      prisma.stat.count(),
      prisma.contentCard.count(),
      prisma.brand.count(),
      prisma.faqItem.count(),
      prisma.contactMessage.count({ where: { read: false } }),
    ]);

  const cards = [
    { label: "Stats en media kit", value: stats, href: "/admin/media-kit" },
    { label: "Tarjetas en el feed", value: contentCards, href: "/admin/feed" },
    { label: "Marcas", value: brands, href: "/admin/marcas" },
    { label: "Preguntas FAQ", value: faqItems, href: "/admin/faq" },
    { label: "Mensajes sin leer", value: unreadMessages, href: "/admin/mensajes" },
  ];

  return (
    <div>
      <h1 className="font-bodoni italic font-bold uppercase text-2xl text-ink">
        Panel de administración
      </h1>
      <p className="mt-sp-2 text-moss">Bienvenida, Crislia. Edita tu sitio desde aquí.</p>

      <div className="mt-sp-8 grid gap-sp-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-md border border-line bg-white p-sp-5 hover:border-coral transition"
          >
            <p className="font-mono text-3xl font-bold text-moss">{card.value}</p>
            <p className="mt-sp-1 text-sm text-ink/70">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
