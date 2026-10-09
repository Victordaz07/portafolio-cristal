import Link from "next/link";
import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser } from "@/lib/agency";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { primaryButtonClass } from "@/lib/admin-ui";

export default async function AgencyClientsPage() {
  const agency = await agencyUser();
  if (!agency) return null;
  const record = await prismaRoot.agency.findUniqueOrThrow({ where: { id: agency.agencyId }, select: { maxCreators: true } });
  const creators = await prismaRoot.creator.findMany({
    where: { agencyId: agency.agencyId },
    select: { id: true, name: true, status: true, plan: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const full = creators.length >= record.maxCreators;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow="Agencia"
        title="Tu cartera de creadoras"
        description={`${creators.length} de ${record.maxCreators} cupos usados.`}
        action={
          !full ? (
            <Link href="/admin/agencia/clientes/nueva" className={primaryButtonClass}>
              + Nueva creadora
            </Link>
          ) : undefined
        }
      />
      {full && <p className="text-sm text-ink/60">Tu cartera está llena. Escríbenos si necesitas más cupos.</p>}

      <Card>
        {creators.length === 0 ? (
          <p className="text-sm text-ink/60">Todavía no agregaste a nadie.</p>
        ) : (
          <ul className="flex flex-col gap-sp-3">
            {creators.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-sp-2 border-t border-line pt-sp-3 first:border-0 first:pt-0">
                <div>
                  <p className="font-medium text-ink">{c.name}</p>
                  <span className={`rounded-full px-[8px] py-px font-mono text-[10px] uppercase ${c.status === "active" ? "bg-sage/30 text-cobalt-ink" : "bg-cream text-ink/55"}`}>
                    {c.status === "active" ? "Activa" : "Pausada"}
                  </span>
                </div>
                <Link href={`/admin/agencia/clientes/${c.id}`} className="text-sm font-medium text-coral hover:underline">
                  Ver ficha →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
