import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { SUPPORT_STATUS, supportCategoryLabel } from "@/lib/support";
import NewTicketForm from "./NewTicketForm";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("es", { day: "numeric", month: "short" });

export default async function SupportPage() {
  const tickets = await prisma.supportTicket.findMany({ orderBy: { lastActivityAt: "desc" }, take: 50 });
  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Ayuda" title="Soporte" description="¿Algo no funciona o tienes una duda? Escríbenos aquí: el equipo de Foliocrew te responde en tu panel y por correo." />
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Nuevo ticket</p>
        <NewTicketForm />
      </Card>
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Tus tickets</p>
        {tickets.length === 0 ? (
          <p className="text-sm text-ink/60">Todavía no abriste ningún ticket.</p>
        ) : (
          <ul className="flex flex-col">
            {tickets.map((t) => {
              const status = SUPPORT_STATUS[t.status] ?? SUPPORT_STATUS.open;
              return (
                <li key={t.id} className="border-t border-line first:border-0">
                  <Link href={`/admin/soporte/${t.id}`} className="flex flex-wrap items-center gap-sp-3 py-sp-3 hover:text-coral">
                    <span className="font-mono text-xs text-ink/50">#{t.number}</span>
                    <span className="min-w-0 flex-1 font-semibold text-ink">
                      {t.subject}
                      {t.unreadByCustomer && <span className="ml-sp-2 rounded-full bg-coral px-[7px] py-px font-mono text-[10px] font-bold text-white">Nueva respuesta</span>}
                    </span>
                    <span className="text-xs text-ink/50">{supportCategoryLabel(t.category)}</span>
                    <span className={`rounded-full px-[8px] py-px font-mono text-[10px] uppercase ${status.tone}`}>{status.label}</span>
                    <span className="text-xs text-ink/50">{fmt(t.lastActivityAt)}</span>
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
