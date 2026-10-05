import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { requireRole } from "@/lib/team";
import { inputClass, secondaryButtonClass } from "@/lib/admin-ui";
import DataRequestRow from "./DataRequestRow";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function TeamDataPage({ searchParams }: { searchParams: Promise<{ q?: string; ver?: string }> }) {
  const user = await requireRole("data");
  if (!user) notFound();
  const { q = "", ver } = await searchParams;
  const showResolved = ver === "resueltos";
  const query = q.trim();

  const [requests, openCount, accounts, metaDeletions] = await Promise.all([
    prismaRoot.dataRequest.findMany({
      where: { status: showResolved ? { not: "open" } : "open" },
      orderBy: { createdAt: showResolved ? "desc" : "asc" },
      take: 50,
      include: { creator: { select: { name: true, slug: true } } },
    }),
    prismaRoot.dataRequest.count({ where: { status: "open" } }),
    query.length >= 2
      ? prismaRoot.creator.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { slug: { contains: query.toLowerCase() } },
              { users: { some: { email: { contains: query.toLowerCase() } } } },
            ],
          },
          select: { id: true, name: true, slug: true, createdAt: true, users: { select: { email: true }, take: 1 } },
          take: 10,
        })
      : [],
    prismaRoot.dataDeletionRequest.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow="Departamentos Foliocrew"
        title="🛟 Recuperación de datos"
        description="Pedidos de las cuentas (copia, recuperar, borrar) y copias de los datos de una cuenta. Todo lo que hagas aquí queda registrado."
      />

      <Card>
        <div className="mb-sp-3 flex flex-wrap items-center gap-sp-2">
          <Link
            href="/admin/equipo/datos"
            className={`rounded-full px-sp-3 py-1.5 text-xs font-semibold ${showResolved ? "border border-line text-ink/70" : "bg-ink text-cream"}`}
          >
            Abiertos ({openCount})
          </Link>
          <Link
            href="/admin/equipo/datos?ver=resueltos"
            className={`rounded-full px-sp-3 py-1.5 text-xs font-semibold ${showResolved ? "bg-ink text-cream" : "border border-line text-ink/70"}`}
          >
            Resueltos
          </Link>
        </div>
        {requests.length === 0 ? (
          <p className="text-sm text-ink/60">{showResolved ? "Todavía no hay pedidos resueltos." : "No hay pedidos abiertos. 🎉"}</p>
        ) : (
          <ul className="flex flex-col gap-sp-4">
            {requests.map((r) => (
              <DataRequestRow
                key={r.id}
                request={{
                  id: r.id,
                  kind: r.kind,
                  detail: r.detail,
                  status: r.status,
                  requestedBy: r.requestedBy,
                  handledBy: r.handledBy,
                  resolution: r.resolution,
                  createdAt: fmt(r.createdAt),
                  resolvedAt: r.resolvedAt ? fmt(r.resolvedAt) : null,
                  creatorId: r.creatorId,
                  account: r.creator.name,
                }}
              />
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Copia de una cuenta</p>
        <form className="flex flex-wrap gap-sp-2">
          <input className={`${inputClass} max-w-sm`} name="q" defaultValue={query} placeholder="Nombre, dirección o correo de la cuenta" />
          <button type="submit" className={secondaryButtonClass}>
            Buscar
          </button>
        </form>
        {query.length >= 2 && accounts.length === 0 && <p className="mt-sp-3 text-sm text-ink/60">No encontré cuentas con «{query}».</p>}
        {accounts.length > 0 && (
          <ul className="mt-sp-3 flex flex-col gap-sp-2 text-sm">
            {accounts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-sp-2 border-t border-line pt-sp-2 first:border-0 first:pt-0">
                <span>
                  <strong className="text-ink">{a.name}</strong> <span className="text-ink/60">· {a.slug} · {a.users[0]?.email ?? "sin usuario"}</span>
                </span>
                <a href={`/api/admin/team/data/export/${a.id}`} className="font-semibold text-coral hover:underline" download>
                  ⬇️ Descargar copia (JSON)
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-sp-3 text-xs text-ink/60">
          La copia incluye notas internas y del equipo, pero nunca contraseñas ni llaves de redes. Cada descarga se anota y la cuenta la ve en Mi cuenta.
        </p>
      </Card>

      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Cómo recuperar algo borrado</p>
        <ol className="list-decimal pl-sp-4 text-sm text-ink/75">
          <li>Pide a la cuenta qué se perdió y más o menos cuándo (fecha y hora).</li>
          <li>
            El Dueño abre Neon → <em>Restore</em> y crea una rama de la base de datos en ese momento (sin tocar la rama principal).
          </li>
          <li>De esa rama se copia solo lo que se perdió a la cuenta, y después se borra la rama.</li>
          <li>Marca el pedido como resuelto con lo que se hizo: la cuenta recibe un correo.</li>
        </ol>
        <p className="mt-sp-2 text-xs text-ink/60">Neon guarda el historial de los últimos días según el plan. Si pasó hace mucho, puede que ya no se pueda.</p>
      </Card>

      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Borrados pedidos desde Meta</p>
        {metaDeletions.length === 0 ? (
          <p className="text-sm text-ink/60">Nadie ha pedido borrar sus datos desde Facebook o Instagram.</p>
        ) : (
          <ul className="flex flex-col gap-sp-1 text-sm">
            {metaDeletions.map((d) => (
              <li key={d.id} className="flex flex-wrap gap-x-sp-2">
                <span className="font-mono text-xs text-ink/50">{fmt(d.createdAt)}</span>
                <span className="text-ink/70">
                  Código {d.code} · {d.deletedAccounts} conexión(es) borrada(s)
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-sp-2 text-xs text-ink/60">Estos se procesan solos: Foliocrew borra la conexión con esa red en cuanto Meta avisa.</p>
      </Card>
    </div>
  );
}
