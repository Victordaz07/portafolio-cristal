import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Card from "./Card";
import { getT } from "@/lib/admin-lang-server";

/** "Completa tu sitio": lo que le falta a una creadora para tener un sitio listo para marcas. Se oculta al completar todo. */
export default async function SetupChecklist() {
  const { t } = await getT();
  const [hero, settings, cards, stats, brands, accounts] = await Promise.all([
    prisma.hero.findFirst({ select: { photoUrl: true } }),
    prisma.siteSettings.findFirst({ select: { instagramHandle: true, tiktokHandle: true } }),
    prisma.contentCard.count(),
    prisma.stat.count(),
    prisma.brand.count(),
    prisma.socialAccount.count(),
  ]);
  const items = [
    { done: !!hero?.photoUrl, title: t("Sube tu foto", "Upload your photo"), href: "/admin/apariencia" },
    { done: cards >= 3, title: t(`Muestra al menos 3 piezas (${Math.min(cards, 3)}/3)`, `Show at least 3 pieces (${Math.min(cards, 3)}/3)`), href: "/admin/feed" },
    { done: stats > 0, title: t("Agrega tus números al media kit", "Add your numbers to the media kit"), href: "/admin/media-kit" },
    { done: !!(settings?.instagramHandle || settings?.tiktokHandle), title: t("Agrega tus redes", "Add your social accounts"), href: "/admin/contacto" },
    { done: accounts > 0, title: t("Conecta Instagram o TikTok", "Connect Instagram or TikTok"), href: "/admin/conectar" },
    { done: brands > 0, title: t("Anota tu primera marca", "Add your first brand"), href: "/admin/marcas" },
  ];
  const completed = items.filter((i) => i.done).length;
  if (completed === items.length) return null;

  return (
    <Card className="mb-sp-5">
      <div className="mb-sp-3 flex flex-wrap items-center justify-between gap-sp-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Completa tu sitio", "Complete your site")}</p>
        <span className="font-mono text-xs text-ink/55">
          {completed} {t("de", "of")} {items.length}
        </span>
      </div>
      <div className="mb-sp-4 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-coral" style={{ width: `${(completed / items.length) * 100}%` }} />
      </div>
      <ul className="grid gap-sp-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.title}>
            <Link
              href={item.href}
              className={`flex items-center gap-sp-2 rounded-[10px] px-sp-3 py-sp-2 text-sm transition ${
                item.done ? "text-ink/45 line-through" : "bg-cream text-ink hover:bg-coral/10"
              }`}
            >
              <span aria-hidden className={item.done ? "text-cobalt" : "text-coral"}>
                {item.done ? "✓" : "○"}
              </span>
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
