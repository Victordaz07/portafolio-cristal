import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { requireRole } from "@/lib/team";
import { inputClass, secondaryButtonClass } from "@/lib/admin-ui";
import DataRequestRow from "./DataRequestRow";
import { dateLocale, type AdminLang } from "@/lib/admin-lang";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

const fmt = (d: Date, lang: AdminLang) => d.toLocaleString(dateLocale(lang), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function TeamDataPage({ searchParams }: { searchParams: Promise<{ q?: string; ver?: string }> }) {
  const user = await requireRole("data");
  if (!user) notFound();
  const { t, lang } = await getT();
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
        eyebrow={t("Departamentos Foliocrew", "Foliocrew departments")}
        title={t("🛟 Recuperación de datos", "🛟 Data recovery")}
        description={t(
          "Pedidos de las cuentas (copia, recuperar, borrar) y copias de los datos de una cuenta. Todo lo que hagas aquí queda registrado.",
          "Account requests (copy, recover, delete) and copies of an account's data. Everything you do here is logged."
        )}
      />

      <Card>
        <div className="mb-sp-3 flex flex-wrap items-center gap-sp-2">
          <Link
            href="/admin/equipo/datos"
            className={`rounded-full px-sp-3 py-1.5 text-xs font-semibold ${showResolved ? "border border-line text-ink/70" : "bg-ink text-cream"}`}
          >
            {t("Abiertos", "Open")} ({openCount})
          </Link>
          <Link
            href="/admin/equipo/datos?ver=resueltos"
            className={`rounded-full px-sp-3 py-1.5 text-xs font-semibold ${showResolved ? "bg-ink text-cream" : "border border-line text-ink/70"}`}
          >
            {t("Resueltos", "Resolved")}
          </Link>
        </div>
        {requests.length === 0 ? (
          <p className="text-sm text-ink/60">{showResolved ? t("Todavía no hay pedidos resueltos.", "No resolved requests yet.") : t("No hay pedidos abiertos. 🎉", "No open requests. 🎉")}</p>
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
                  createdAt: fmt(r.createdAt, lang),
                  resolvedAt: r.resolvedAt ? fmt(r.resolvedAt, lang) : null,
                  creatorId: r.creatorId,
                  account: r.creator.name,
                }}
              />
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Copia de una cuenta", "Copy of an account")}</p>
        <form className="flex flex-wrap gap-sp-2">
          <input className={`${inputClass} max-w-sm`} name="q" defaultValue={query} placeholder={t("Nombre, dirección o correo de la cuenta", "Account name, address or email")} />
          <button type="submit" className={secondaryButtonClass}>
            {t("Buscar", "Search")}
          </button>
        </form>
        {query.length >= 2 && accounts.length === 0 && <p className="mt-sp-3 text-sm text-ink/60">{t(`No encontré cuentas con «${query}».`, `No accounts found for “${query}”.`)}</p>}
        {accounts.length > 0 && (
          <ul className="mt-sp-3 flex flex-col gap-sp-2 text-sm">
            {accounts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-sp-2 border-t border-line pt-sp-2 first:border-0 first:pt-0">
                <span>
                  <strong className="text-ink">{a.name}</strong> <span className="text-ink/60">· {a.slug} · {a.users[0]?.email ?? t("sin usuario", "no user")}</span>
                </span>
                <a href={`/api/admin/team/data/export/${a.id}`} className="font-semibold text-coral hover:underline" download>
                  {t("⬇️ Descargar copia (JSON)", "⬇️ Download copy (JSON)")}
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-sp-3 text-xs text-ink/60">
          {t(
            "La copia incluye notas internas y del equipo, pero nunca contraseñas ni llaves de redes. Cada descarga se anota y la cuenta la ve en Mi cuenta.",
            "The copy includes internal and team notes, but never passwords or social network keys. Every download is logged and the account sees it in My account."
          )}
        </p>
      </Card>

      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Cómo recuperar algo borrado", "How to recover something deleted")}</p>
        <ol className="list-decimal pl-sp-4 text-sm text-ink/75">
          <li>{t("Pide a la cuenta qué se perdió y más o menos cuándo (fecha y hora).", "Ask the account what was lost and roughly when (date and time).")}</li>
          <li>
            {t("El Dueño abre Neon →", "The Owner opens Neon →")} <em>Restore</em>{" "}
            {t("y crea una rama de la base de datos en ese momento (sin tocar la rama principal).", "and creates a database branch at that moment (without touching the main branch).")}
          </li>
          <li>{t("De esa rama se copia solo lo que se perdió a la cuenta, y después se borra la rama.", "From that branch, copy only what was lost back to the account, then delete the branch.")}</li>
          <li>{t("Marca el pedido como resuelto con lo que se hizo: la cuenta recibe un correo.", "Mark the request resolved with what was done: the account gets an email.")}</li>
        </ol>
        <p className="mt-sp-2 text-xs text-ink/60">
          {t(
            "Neon guarda el historial de los últimos días según el plan. Si pasó hace mucho, puede que ya no se pueda.",
            "Neon keeps history for the last few days depending on the plan. If it was long ago, it may no longer be possible."
          )}
        </p>
      </Card>

      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Borrados pedidos desde Meta", "Deletions requested through Meta")}</p>
        {metaDeletions.length === 0 ? (
          <p className="text-sm text-ink/60">{t("Nadie ha pedido borrar sus datos desde Facebook o Instagram.", "Nobody has asked to delete their data from Facebook or Instagram.")}</p>
        ) : (
          <ul className="flex flex-col gap-sp-1 text-sm">
            {metaDeletions.map((d) => (
              <li key={d.id} className="flex flex-wrap gap-x-sp-2">
                <span className="font-mono text-xs text-ink/50">{fmt(d.createdAt, lang)}</span>
                <span className="text-ink/70">
                  {t(`Código ${d.code} · ${d.deletedAccounts} conexión(es) borrada(s)`, `Code ${d.code} · ${d.deletedAccounts} connection(s) deleted`)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-sp-2 text-xs text-ink/60">
          {t("Estos se procesan solos: Foliocrew borra la conexión con esa red en cuanto Meta avisa.", "These are processed automatically: Foliocrew deletes the connection as soon as Meta notifies us.")}
        </p>
      </Card>
    </div>
  );
}
