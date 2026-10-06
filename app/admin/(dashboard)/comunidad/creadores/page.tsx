import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { CREATOR_TYPES, LIMITS, connectionState, creatorTypeLabel, isCreatorType } from "@/lib/community";
import { blockedIds, postAuthorSelect } from "@/lib/community-server";
import { NICHES } from "@/lib/onboarding";
import { pickLabel } from "@/lib/admin-lang";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import AuthorBadge from "@/components/community/AuthorBadge";
import ConnectButton from "@/components/community/ConnectButton";

export const dynamic = "force-dynamic";

type Params = { q?: string; tipo?: string; nicho?: string; ciudad?: string; idioma?: string; colab?: string; n?: string };

/** Buscar colaboradores: perfiles de la comunidad con filtros por tipo de creador, nicho, ciudad e idioma. */
export default async function FindCreatorsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const me = session.creatorId;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const type = isCreatorType(sp.tipo) ? sp.tipo : undefined;
  const niche = NICHES.some((n) => n.id === sp.nicho) ? sp.nicho : undefined;
  const city = (sp.ciudad ?? "").trim().slice(0, 80);
  const language = sp.idioma === "es" || sp.idioma === "en" ? sp.idioma : undefined;
  const collab = sp.colab === "1";
  const take = Math.min(200, Math.max(LIMITS.pageSize, Number(sp.n) || LIMITS.pageSize));

  const blocked = await blockedIds(me);
  const where: Prisma.CommunityProfileWhereInput = {
    acceptedRulesAt: { not: null },
    creator: { status: "active" },
    creatorId: { notIn: [me, ...blocked] },
    ...(type ? { creatorTypes: { has: type } } : {}),
    ...(niche ? { niche } : {}),
    ...(language ? { languages: { has: language } } : {}),
    ...(collab ? { openToCollab: true } : {}),
    // La ciudad solo cuenta si la persona eligió mostrarla.
    ...(city ? { showCity: true, city: { contains: city, mode: "insensitive" } } : {}),
    ...(q
      ? {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { headline: { contains: q, mode: "insensitive" } },
            { creator: { slug: { contains: q.replace(/^@/, "").toLowerCase() } } },
          ],
        }
      : {}),
  };
  const rows = await prismaRoot.communityProfile.findMany({
    where,
    orderBy: [{ openToCollab: "desc" }, { reputation: "desc" }, { createdAt: "desc" }],
    take: take + 1,
    select: { ...postAuthorSelect, creatorId: true, headline: true, niche: true, creatorTypes: true, city: true, showCity: true, languages: true, openToCollab: true },
  });
  const profiles = rows.slice(0, take);
  const connections = profiles.length
    ? await prismaRoot.communityConnection.findMany({
        where: {
          OR: [
            { requesterId: me, addresseeId: { in: profiles.map((p) => p.creatorId) } },
            { addresseeId: me, requesterId: { in: profiles.map((p) => p.creatorId) } },
          ],
        },
      })
    : [];
  const connectionWith = (id: string) => connections.find((c) => c.requesterId === id || c.addresseeId === id) ?? null;
  const filtered = Boolean(q || type || niche || city || language || collab);
  const moreHref = () => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, tipo: type, nicho: niche, ciudad: city, idioma: language, colab: collab ? "1" : "" })) if (v) qs.set(k, v);
    qs.set("n", String(take + LIMITS.pageSize));
    return `/admin/comunidad/creadores?${qs}`;
  };
  const select = `${inputClass} py-sp-2 text-sm`;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Comunidad", "Community")}
        title={t("Buscar colaboradores", "Find collaborators")}
        description={t(
          "Encuentra creadores por red, nicho, ciudad o idioma para armar colaboraciones.",
          "Find creators by platform, niche, city or language to team up on collabs."
        )}
      />

      <Card>
        <form method="get" className="grid grid-cols-1 gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
          <input name="q" defaultValue={q} placeholder={t("Nombre, @usuario o a qué se dedica", "Name, @handle or what they do")} className={`${select} sm:col-span-2 lg:col-span-3`} />
          <select name="tipo" defaultValue={type ?? ""} className={select} aria-label={t("Tipo de creador", "Creator type")}>
            <option value="">{t("Cualquier tipo de creador", "Any creator type")}</option>
            {CREATOR_TYPES.map((c) => (
              <option key={c.id} value={c.id}>
                {pickLabel(lang, c)}
              </option>
            ))}
          </select>
          <select name="nicho" defaultValue={niche ?? ""} className={select} aria-label={t("Nicho", "Niche")}>
            <option value="">{t("Cualquier nicho", "Any niche")}</option>
            {NICHES.map((n) => (
              <option key={n.id} value={n.id}>
                {pickLabel(lang, n)}
              </option>
            ))}
          </select>
          <select name="idioma" defaultValue={language ?? ""} className={select} aria-label={t("Idioma", "Language")}>
            <option value="">{t("Cualquier idioma", "Any language")}</option>
            <option value="es">{t("Español", "Spanish")}</option>
            <option value="en">{t("Inglés", "English")}</option>
          </select>
          <input name="ciudad" defaultValue={city} placeholder={t("Ciudad", "City")} className={select} />
          <label className="flex items-center gap-sp-2 text-sm text-ink/75">
            <input type="checkbox" name="colab" value="1" defaultChecked={collab} />
            {t("🤝 Solo abiertos a colaborar", "🤝 Only open to collabs")}
          </label>
          <div className="flex items-center gap-sp-3">
            <button type="submit" className={primaryButtonClass}>
              {t("Buscar", "Search")}
            </button>
            {filtered && (
              <Link href="/admin/comunidad/creadores" className="text-xs font-semibold text-coral hover:underline">
                {t("Quitar filtros", "Clear filters")}
              </Link>
            )}
          </div>
        </form>
      </Card>

      {profiles.length === 0 ? (
        <Card className="text-center text-sm text-ink/60">
          {filtered
            ? t("No encontramos creadores con esos filtros. Prueba con menos.", "No creators match those filters. Try fewer.")
            : t("Todavía no hay otros creadores en la comunidad.", "There are no other creators in the community yet.")}
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-sp-3 md:grid-cols-2">
          {profiles.map((p) => {
            const connection = connectionWith(p.creatorId);
            const nicheInfo = NICHES.find((n) => n.id === p.niche);
            return (
              <li key={p.id} className="flex flex-col gap-sp-2 rounded-[18px] border border-line bg-white p-sp-4">
                <AuthorBadge author={p} lang={lang} size={44} />
                {p.headline && <p className="text-sm text-ink/70">{p.headline}</p>}
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {p.openToCollab && <span className="rounded-full bg-coral/15 px-sp-2 py-0.5 font-semibold text-coral">{t("🤝 Abierto a colaborar", "🤝 Open to collabs")}</span>}
                  {nicheInfo && <span className="rounded-full bg-lime/30 px-sp-2 py-0.5 text-moss">{pickLabel(lang, nicheInfo)}</span>}
                  {p.creatorTypes.slice(0, 4).map((ct) => (
                    <span key={ct} className="rounded-full border border-line px-sp-2 py-0.5 text-ink/65">
                      {creatorTypeLabel(ct, lang)}
                    </span>
                  ))}
                </div>
                <p className="flex flex-wrap gap-x-sp-3 text-xs text-ink/55">
                  {p.showCity && p.city && <span>📍 {p.city}</span>}
                  <span>🗣️ {p.languages.map((l) => (l === "en" ? "EN" : "ES")).join(" · ")}</span>
                </p>
                {!session.actorId && (
                  <div className="mt-auto pt-sp-1">
                    <ConnectButton handle={p.creator.slug} name={p.displayName} state={connectionState(connection, me)} connectionId={connection?.id ?? null} compact />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > take && (
        <Link href={moreHref()} scroll={false} className="self-center rounded-full border border-line bg-white px-sp-5 py-sp-2 text-sm font-semibold text-ink hover:border-coral">
          {t("Ver más", "Show more")}
        </Link>
      )}
    </div>
  );
}
