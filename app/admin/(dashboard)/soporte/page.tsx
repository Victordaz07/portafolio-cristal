import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { SUPPORT_STATUS, supportCategoryLabel } from "@/lib/support";
import NewTicketForm from "./NewTicketForm";
import { dateLocale, pickLabel, type AdminLang } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const fmt = (d: Date, lang: AdminLang) => d.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short" });

export default async function SupportPage() {
  const { t, lang } = await getT();
  const tickets = await prisma.supportTicket.findMany({ orderBy: { lastActivityAt: "desc" }, take: 50 });
  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Ayuda", "Help")}
        title={t("Soporte", "Support")}
        description={t("¿Algo no funciona o tienes una duda? Escríbenos aquí: el equipo de Foliocrew te responde en tu panel y por correo.", "Something not working or have a question? Write to us here: the Foliocrew team replies in your dashboard and by email.")}
      />
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Nuevo ticket", "New ticket")}</p>
        <NewTicketForm />
      </Card>
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Tus tickets", "Your tickets")}</p>
        {tickets.length === 0 ? (
          <p className="text-sm text-ink/60">{t("Todavía no abriste ningún ticket.", "You haven't opened any tickets yet.")}</p>
        ) : (
          <ul className="flex flex-col">
            {tickets.map((tk) => {
              const status = SUPPORT_STATUS[tk.status] ?? SUPPORT_STATUS.open;
              return (
                <li key={tk.id} className="border-t border-line first:border-0">
                  <Link href={`/admin/soporte/${tk.id}`} className="flex flex-wrap items-center gap-sp-3 py-sp-3 hover:text-coral">
                    <span className="font-mono text-xs text-ink/50">#{tk.number}</span>
                    <span className="min-w-0 flex-1 font-semibold text-ink">
                      {tk.subject}
                      {tk.unreadByCustomer && (
                        <span className="ml-sp-2 rounded-full bg-coral px-[7px] py-px font-mono text-[10px] font-bold text-white">{t("Nueva respuesta", "New reply")}</span>
                      )}
                    </span>
                    <span className="text-xs text-ink/50">{supportCategoryLabel(tk.category, lang)}</span>
                    <span className={`rounded-full px-[8px] py-px font-mono text-[10px] uppercase ${status.tone}`}>{pickLabel(lang, status)}</span>
                    <span className="text-xs text-ink/50">{fmt(tk.lastActivityAt, lang)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
