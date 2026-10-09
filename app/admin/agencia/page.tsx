import Link from "next/link";
import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser } from "@/lib/agency";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { primaryButtonClass } from "@/lib/admin-ui";
import { billingState, billingLabel } from "@/lib/billing";

export default async function AgencyHomePage() {
  const agency = await agencyUser();
  if (!agency) return null;
  const record = await prismaRoot.agency.findUniqueOrThrow({ where: { id: agency.agencyId } });
  const creators = await prismaRoot.creator.findMany({ where: { agencyId: agency.agencyId }, select: { id: true, name: true, status: true }, orderBy: { createdAt: "asc" } });
  const billing = billingState({ ...record, plan: "crew" });

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Agencia" title={`Hola, ${record.name}`} description="Tu cartera, tu equipo y tu facturación, en un solo lugar." />
      <div className="grid gap-sp-4 md:grid-cols-3">
        <Card>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Cartera</p>
          <p className="mt-sp-2 text-3xl font-semibold text-ink">
            {creators.length} <span className="text-base font-normal text-ink/50">/ {record.maxCreators}</span>
          </p>
          <Link href="/admin/agencia/clientes" className="mt-sp-3 inline-block text-sm font-medium text-coral hover:underline">
            Ver cartera →
          </Link>
        </Card>
        <Card>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Plan</p>
          <p className="mt-sp-2 text-xl font-semibold text-ink">Crew</p>
          <p className="mt-sp-1 text-sm text-ink/60">{billingLabel(billing.state)}</p>
          <Link href="/admin/agencia/facturacion" className="mt-sp-3 inline-block text-sm font-medium text-coral hover:underline">
            Ver facturación →
          </Link>
        </Card>
        <Card>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Agregar</p>
          <p className="mt-sp-2 text-sm text-ink/70">Suma una creadora nueva a tu cartera.</p>
          <Link href="/admin/agencia/clientes/nueva" className={`${primaryButtonClass} mt-sp-3`}>
            + Nueva creadora
          </Link>
        </Card>
      </div>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Tu cartera</p>
        {creators.length === 0 ? (
          <p className="text-sm text-ink/60">Todavía no tienes creadoras en tu cartera.</p>
        ) : (
          <ul className="flex flex-col gap-sp-2">
            {creators.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-t border-line pt-sp-3 first:border-0 first:pt-0">
                <span className="font-medium text-ink">{c.name}</span>
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
