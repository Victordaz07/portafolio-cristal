"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentCard } from "@prisma/client";
import type { ContentType, Platform } from "@/lib/embeds";
import { platformLabel } from "@/lib/embeds";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import Card from "@/components/admin/Card";
import { swapOrder } from "@/lib/reorder";
import { accentLinkClass, dangerLinkClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { formatShortDate } from "@/lib/crm";
import { metricTiles } from "@/lib/metrics";
import { pickLabel } from "@/lib/admin-lang";
import ContentCardForm, { type ContentCardFormValues, type BrandOption } from "./ContentCardForm";
import { useT } from "@/components/admin/AdminLang";

const API_BASE = "/api/admin/content-cards";

type TypeFilter = "all" | "video" | "photo";
type PlatformFilter = "all" | Platform;

const PLATFORM_FILTERS: { id: Platform; label: string; labelEn: string }[] = [
  { id: "tiktok", label: "TikTok", labelEn: "TikTok" },
  { id: "instagram", label: "Instagram", labelEn: "Instagram" },
  { id: "facebook", label: "Facebook", labelEn: "Facebook" },
  { id: "ugc", label: "Fotos propias", labelEn: "Own photos" },
];

const chipClass = (active: boolean) =>
  `rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
    active ? "bg-coral text-white" : "border border-line bg-white text-ink/70 hover:border-coral"
  }`;

const ADMIN_METRIC_LABELS = { views: "Vistas", likes: "Likes", comments: "Coment.", engagement: "Engag." };
const ADMIN_METRIC_LABELS_EN = { views: "Views", likes: "Likes", comments: "Comm.", engagement: "Engag." };

export default function FeedManager({
  initialCards,
  thumbnailsById = {},
  brands,
  syncablePlatforms = [],
}: {
  initialCards: ContentCard[];
  thumbnailsById?: Record<string, string | null>;
  brands: BrandOption[];
  syncablePlatforms?: string[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { t, lang } = useT();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [metricsFor, setMetricsFor] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [cards, setCards] = useState(initialCards);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ContentCard | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(cards.map((card) => card.category))),
    [cards]
  );

  async function handleCreate(values: ContentCardFormValues) {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? t("No se pudo crear la tarjeta", "Couldn't create the card"));
      return;
    }

    const created: ContentCard = await response.json();
    setCards((current) => [...current, created]);
    setShowCreate(false);
    showToast("success", t("Tarjeta agregada al feed", "Card added to the feed"));
  }

  async function handleUpdate(id: string, values: ContentCardFormValues) {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? t("No se pudo actualizar la tarjeta", "Couldn't update the card"));
      return;
    }

    const updated: ContentCard = await response.json();
    setCards((current) => current.map((card) => (card.id === id ? updated : card)));
    setEditingId(null);
    showToast("success", t("Tarjeta actualizada", "Card updated"));
  }

  async function handleDelete(card: ContentCard) {
    const response = await fetch(`${API_BASE}/${card.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", t("No se pudo eliminar", "Couldn't delete"));
      return;
    }
    setCards((current) => current.filter((item) => item.id !== card.id));
    showToast("success", t("Tarjeta eliminada", "Card deleted"));
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(cards, index, direction, API_BASE);
    setCards(next);
  }

  async function saveMetrics(id: string, body: Record<string, unknown>) {
    const response = await fetch(`${API_BASE}/${id}/metrics`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showToast("error", data.error ?? t("No se pudieron guardar las métricas", "Couldn't save the metrics"));
      return false;
    }
    setCards((current) => current.map((card) => (card.id === id ? (data as ContentCard) : card)));
    return true;
  }

  async function syncMetrics() {
    setSyncing(true);
    try {
      const response = await fetch(`${API_BASE}/sync-metrics`, { method: "POST" });
      const data: { results: { platform: string; matched: number; checked: number; error?: string }[]; updated: number } =
        await response.json();
      const failed = data.results.filter((r) => r.error);
      if (failed.length) showToast("error", failed.map((r) => `${r.platform}: ${r.error}`).join(" · "));
      else if (data.results.length === 0) showToast("error", t("No hay tarjetas de Instagram o TikTok con link para sincronizar", "There are no Instagram or TikTok cards with a link to sync"));
      else showToast("success", t(`Métricas actualizadas en ${data.updated} ${data.updated === 1 ? "publicación" : "publicaciones"}`, `Metrics updated on ${data.updated} ${data.updated === 1 ? "post" : "posts"}`));
      router.refresh();
    } catch {
      showToast("error", t("No se pudo sincronizar", "Couldn't sync"));
    } finally {
      setSyncing(false);
    }
  }

  const byType = cards.filter((card) => typeFilter === "all" || card.type === typeFilter);
  const visibleCards = byType.filter((card) => platformFilter === "all" || card.platform === platformFilter);
  // Solo se muestran las redes que tienen publicaciones (con el filtro de tipo aplicado), con su cantidad.
  const platformCounts = PLATFORM_FILTERS.map((p) => ({ ...p, count: byType.filter((card) => card.platform === p.id).length })).filter(
    (p) => p.count > 0 || p.id === platformFilter
  );
  const filtering = typeFilter !== "all" || platformFilter !== "all";

  return (
    <div>
      <div className="mb-sp-4 flex flex-wrap items-center justify-between gap-sp-3">
        <div className="flex flex-wrap gap-sp-2">
          {(
            [
              { id: "all", label: t("Todas", "All") },
              { id: "video", label: t("Reels / Videos", "Reels / Videos") },
              { id: "photo", label: t("Fotos", "Photos") },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setTypeFilter(filter.id)}
              aria-pressed={typeFilter === filter.id}
              className={chipClass(typeFilter === filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-sp-2">
          {syncablePlatforms.length > 0 && (
            <button type="button" onClick={syncMetrics} disabled={syncing} className={secondaryButtonClass}>
              {syncing ? t("Sincronizando…", "Syncing…") : t("↻ Sincronizar métricas", "↻ Sync metrics")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-ink px-sp-5 py-2.5 text-sm font-bold text-cream transition hover:opacity-90"
          >
            {t("+ Agregar publicación", "+ Add post")}
          </button>
        </div>
      </div>
      {platformCounts.length > 1 && (
        <div className="mb-sp-4 flex flex-wrap items-center gap-sp-2" role="group" aria-label={t("Filtrar por red", "Filter by network")}>
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink/45">{t("Red", "Network")}</span>
          <button type="button" onClick={() => setPlatformFilter("all")} aria-pressed={platformFilter === "all"} className={chipClass(platformFilter === "all")}>
            {t("Todas", "All")}
          </button>
          {platformCounts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatformFilter(p.id)}
              aria-pressed={platformFilter === p.id}
              className={chipClass(platformFilter === p.id)}
            >
              {pickLabel(lang, p)} <span className="opacity-70">· {p.count}</span>
            </button>
          ))}
        </div>
      )}
      <p className="mb-sp-4 text-xs text-ink/55">
        {visibleCards.length} {visibleCards.length === 1 ? t("publicación", "post") : t("publicaciones", "posts")}
        {filtering && t(" · Para reordenar, vuelve a \"Todas\" en ambos filtros", " · To reorder, go back to \"All\" in both filters")}
        {syncablePlatforms.length === 0 &&
          t(" · Conecta Instagram o TikTok en Conectar cuentas para traer las métricas solas.", " · Connect Instagram or TikTok in Connect accounts to pull metrics automatically.")}
      </p>

      {showCreate && (
        <Card className="mb-sp-5">
          <ContentCardForm
            existingCategories={categories}
            existingBrands={brands}
            submitLabel={t("Agregar tarjeta", "Add card")}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        </Card>
      )}

      <div className="grid gap-sp-4 lg:grid-cols-2">
        {visibleCards.map((card) => {
          const index = cards.indexOf(card);
          if (editingId === card.id) {
            return (
              <Card key={card.id} className="lg:col-span-2">
                <ContentCardForm
                  initial={{
                    type: card.type as ContentType,
                    platform: card.platform as Platform,
                    postUrl: card.postUrl ?? "",
                    videoUrl: card.videoUrl ?? "",
                    photoUrl: card.photoUrl ?? "",
                    thumbnailUrl: card.thumbnailUrl ?? "",
                    caption: card.caption,
                    captionEn: card.captionEn ?? "",
                    category: card.category,
                    categoryEn: card.categoryEn ?? "",
                    statPrimary: card.statPrimary ?? "",
                    statPrimaryEn: card.statPrimaryEn ?? "",
                    statSecondary: card.statSecondary ?? "",
                    statSecondaryEn: card.statSecondaryEn ?? "",
                    brandId: card.brandId ?? "",
                  }}
                  existingCategories={categories}
                  existingBrands={brands}
                  submitLabel={t("Guardar cambios", "Save changes")}
                  onSubmit={(values) => handleUpdate(card.id, values)}
                  onCancel={() => setEditingId(null)}
                />
              </Card>
            );
          }
          const brandName = card.brandId ? brands.find((brand) => brand.id === card.brandId)?.name : null;
          const tiles = metricTiles(card, lang === "en" ? ADMIN_METRIC_LABELS_EN : ADMIN_METRIC_LABELS);
          return (
            <Card key={card.id} className={`flex flex-col gap-sp-3 p-sp-4 ${metricsFor === card.id ? "lg:col-span-2" : ""}`}>
              <div className="flex gap-sp-4">
                <div className="relative w-[96px] shrink-0 sm:w-[120px]">
                  {thumbnailsById[card.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnailsById[card.id]!}
                      alt=""
                      className={`w-full rounded-[12px] object-cover ${card.type === "video" ? "aspect-[9/16]" : "aspect-[4/5]"}`}
                    />
                  ) : (
                    <div
                      className={`w-full rounded-[12px] bg-ink ${card.type === "video" ? "aspect-[9/16]" : "aspect-[4/5]"}`}
                    />
                  )}
                  <span className="absolute left-1.5 top-1.5 max-w-[90%] truncate rounded-[4px] bg-lime px-1.5 py-0.5 font-mono text-[8px] uppercase text-ink">
                    {(lang === "en" && card.categoryEn) || card.category}
                  </span>
                  {card.featured && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-white px-1 text-[10px]" title={t("Destacada en Colaboraciones", "Featured in Collaborations")}>
                      ★
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-sp-2">
                  <p className="line-clamp-2 text-sm font-bold text-ink">{(lang === "en" && card.captionEn) || card.caption}</p>
                  <p className="text-[11px] text-ink/55">
                    {platformLabel(card.platform as Platform)} · {card.type === "video" ? "Video" : t("Foto", "Photo")}
                    {brandName && (
                      <>
                        {" "}
                        · <strong className="text-ink">{brandName}</strong>
                      </>
                    )}
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {tiles.map((tile) => (
                      <div key={tile.key} className="rounded-[8px] bg-cream px-1.5 py-1">
                        <p className={`font-mono text-[12px] font-bold ${tile.highlight ? "text-coral" : "text-ink"}`}>
                          {tile.value}
                        </p>
                        <p className="text-[8px] uppercase text-ink/55">{tile.label}</p>
                      </div>
                    ))}
                  </div>
                  {card.topComment && (
                    <p className="truncate rounded-[8px] bg-ink px-sp-2 py-1 text-[11px] text-cream">
                      <span className="mr-1 font-mono text-[8px] uppercase text-lime">{t("Lo que dicen", "What people say")}</span>
                      “{card.topComment}”
                    </p>
                  )}
                  <p className="text-[10px] text-ink/45">
                    {card.metricsSyncedAt
                      ? t(`Métricas sincronizadas el ${formatShortDate(card.metricsSyncedAt, lang)}`, `Metrics synced on ${formatShortDate(card.metricsSyncedAt, lang)}`)
                      : t("Métricas manuales", "Manual metrics")}
                    {!card.showMetrics && t(" · ocultas en el sitio", " · hidden on the site")}
                  </p>
                </div>
              </div>

              {metricsFor === card.id && (
                <MetricsEditor
                  card={card}
                  onCancel={() => setMetricsFor(null)}
                  onSave={async (body) => {
                    if (await saveMetrics(card.id, body)) {
                      setMetricsFor(null);
                      showToast("success", t("Métricas guardadas", "Metrics saved"));
                    }
                  }}
                />
              )}

              <div className="flex flex-wrap items-center gap-sp-3 border-t border-line pt-sp-2 text-sm">
                {!filtering && (
                  <ReorderButtons
                    onUp={() => handleMove(index, "up")}
                    onDown={() => handleMove(index, "down")}
                    disableUp={index === 0}
                    disableDown={index === cards.length - 1}
                  />
                )}
                <button type="button" onClick={() => setEditingId(card.id)} className={accentLinkClass}>
                  {t("Editar", "Edit")}
                </button>
                <button
                  type="button"
                  onClick={() => setMetricsFor(metricsFor === card.id ? null : card.id)}
                  className={accentLinkClass}
                >
                  {t("Métricas", "Metrics")}
                </button>
                {card.brandId && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (await saveMetrics(card.id, { featured: !card.featured })) {
                        showToast("success", card.featured ? t("Ya no está destacada", "No longer featured") : t("Destacada en Colaboraciones", "Featured in Collaborations"));
                      }
                    }}
                    className="text-sm font-medium text-ink/60 hover:text-ink"
                  >
                    {card.featured ? t("★ Destacada", "★ Featured") : t("☆ Destacar", "☆ Feature")}
                  </button>
                )}
                <button type="button" onClick={() => setPendingDelete(card)} className={`${dangerLinkClass} ml-auto`}>
                  {t("Eliminar", "Delete")}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title={t("Eliminar tarjeta", "Delete card")}
          description={t(`¿Eliminar "${pendingDelete.caption}"?`, `Delete "${pendingDelete.caption}"?`)}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

const METRIC_FIELDS = [
  { key: "views", label: "Vistas", labelEn: "Views" },
  { key: "likes", label: "Likes", labelEn: "Likes" },
  { key: "comments", label: "Comentarios", labelEn: "Comments" },
  { key: "shares", label: "Compartidos", labelEn: "Shares" },
  { key: "saves", label: "Guardados", labelEn: "Saves" },
] as const;

function MetricsEditor({
  card,
  onSave,
  onCancel,
}: {
  card: ContentCard;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const { t, lang } = useT();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(METRIC_FIELDS.map((f) => [f.key, card[f.key] == null ? "" : String(card[f.key])]))
  );
  const [topComment, setTopComment] = useState(card.topComment ?? "");
  const [topCommentEn, setTopCommentEn] = useState(card.topCommentEn ?? "");
  const [author, setAuthor] = useState(card.topCommentAuthor ?? "");
  const [showMetrics, setShowMetrics] = useState(card.showMetrics);
  // <input type="datetime-local"> trabaja en la hora local del navegador.
  const [postedAt, setPostedAt] = useState(() => {
    if (!card.postedAt) return "";
    const d = new Date(card.postedAt);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const numbers = Object.fromEntries(
      METRIC_FIELDS.map((f) => {
        const raw = values[f.key].replace(/[.,\s]/g, "");
        return [f.key, raw === "" ? null : Number(raw)];
      })
    );
    await onSave({
      ...numbers,
      topComment,
      topCommentEn,
      topCommentAuthor: author,
      showMetrics,
      postedAt: postedAt ? new Date(postedAt).toISOString() : null,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sp-3 rounded-[14px] bg-cream p-sp-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-coral">{t("Métricas y comentario destacado", "Metrics & featured comment")}</p>
      <div className="grid grid-cols-2 gap-sp-2 sm:grid-cols-5">
        {METRIC_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-ink/70">{pickLabel(lang, field)}</span>
            <input
              inputMode="numeric"
              value={values[field.key]}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className={inputClass}
              placeholder="—"
            />
          </label>
        ))}
      </div>
      <div className="grid gap-sp-2 sm:grid-cols-[1fr_1fr_180px]">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-ink/70">{t("Lo que dicen (comentario destacado)", "What people say (featured comment)")}</span>
          <input value={topComment} onChange={(e) => setTopComment(e.target.value)} className={inputClass} placeholder={t("¿Qué base usaste? La necesito ya 😍", "What foundation did you use? I need it now 😍")} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-ink/70">{t("En inglés (opcional)", "In English (optional)")}</span>
          <input value={topCommentEn} onChange={(e) => setTopCommentEn(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-ink/70">{t("Quién lo dijo", "Who said it")}</span>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} placeholder="@valeria.mua" />
        </label>
      </div>
      <label className="flex max-w-xs flex-col gap-1">
        <span className="text-[11px] font-medium text-ink/70">{t("Publicado el (para “mejor hora para publicar”)", "Posted on (for “best time to post”)")}</span>
        <input type="datetime-local" value={postedAt} onChange={(e) => setPostedAt(e.target.value)} className={inputClass} />
      </label>
      <label className="flex items-center gap-sp-2 text-sm text-ink">
        <input type="checkbox" checked={showMetrics} onChange={(e) => setShowMetrics(e.target.checked)} />
        {t("Mostrar las métricas en el sitio público", "Show the metrics on the public site")}
      </label>
      <p className="text-[11px] text-ink/50">
        {t("El engagement se calcula solo: (likes + comentarios + compartidos + guardados) ÷ vistas. Al sincronizar, solo se reemplazan los números que la red devuelve.", "Engagement is calculated automatically: (likes + comments + shares + saves) ÷ views. When syncing, only the numbers the network returns are replaced.")}
      </p>
      <div className="flex gap-sp-2">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? t("Guardando…", "Saving…") : t("Guardar métricas", "Save metrics")}
        </button>
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          {t("Cancelar", "Cancel")}
        </button>
      </div>
    </form>
  );
}
