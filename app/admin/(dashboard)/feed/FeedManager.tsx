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
import ContentCardForm, { type ContentCardFormValues, type BrandOption } from "./ContentCardForm";

const API_BASE = "/api/admin/content-cards";

type TypeFilter = "all" | "video" | "photo";

const ADMIN_METRIC_LABELS = { views: "Vistas", likes: "Likes", comments: "Coment.", engagement: "Engag." };

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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
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
      showToast("error", data.error ?? "No se pudo crear la tarjeta");
      return;
    }

    const created: ContentCard = await response.json();
    setCards((current) => [...current, created]);
    setShowCreate(false);
    showToast("success", "Tarjeta agregada al feed");
  }

  async function handleUpdate(id: string, values: ContentCardFormValues) {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo actualizar la tarjeta");
      return;
    }

    const updated: ContentCard = await response.json();
    setCards((current) => current.map((card) => (card.id === id ? updated : card)));
    setEditingId(null);
    showToast("success", "Tarjeta actualizada");
  }

  async function handleDelete(card: ContentCard) {
    const response = await fetch(`${API_BASE}/${card.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", "No se pudo eliminar");
      return;
    }
    setCards((current) => current.filter((item) => item.id !== card.id));
    showToast("success", "Tarjeta eliminada");
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
      showToast("error", data.error ?? "No se pudieron guardar las métricas");
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
      else if (data.results.length === 0) showToast("error", "No hay tarjetas de Instagram o TikTok con link para sincronizar");
      else showToast("success", `Métricas actualizadas en ${data.updated} ${data.updated === 1 ? "publicación" : "publicaciones"}`);
      router.refresh();
    } catch {
      showToast("error", "No se pudo sincronizar");
    } finally {
      setSyncing(false);
    }
  }

  const visibleCards = cards.filter((card) => typeFilter === "all" || card.type === typeFilter);

  return (
    <div>
      <div className="mb-sp-4 flex flex-wrap items-center justify-between gap-sp-3">
        <div className="flex flex-wrap gap-sp-2">
          {(
            [
              { id: "all", label: "Todas" },
              { id: "video", label: "Reels / Videos" },
              { id: "photo", label: "Fotos" },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setTypeFilter(filter.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                typeFilter === filter.id ? "bg-coral text-white" : "border border-line bg-white text-ink/70 hover:border-coral"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-sp-2">
          {syncablePlatforms.length > 0 && (
            <button type="button" onClick={syncMetrics} disabled={syncing} className={secondaryButtonClass}>
              {syncing ? "Sincronizando…" : "↻ Sincronizar métricas"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-ink px-sp-5 py-2.5 text-sm font-bold text-cream transition hover:opacity-90"
          >
            + Agregar publicación
          </button>
        </div>
      </div>
      <p className="mb-sp-4 text-xs text-ink/55">
        {visibleCards.length} {visibleCards.length === 1 ? "publicación" : "publicaciones"}
        {syncablePlatforms.length === 0 &&
          " · Conecta Instagram o TikTok en Conectar cuentas para traer las métricas solas."}
      </p>

      {showCreate && (
        <Card className="mb-sp-5">
          <ContentCardForm
            existingCategories={categories}
            existingBrands={brands}
            submitLabel="Agregar tarjeta"
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
                  submitLabel="Guardar cambios"
                  onSubmit={(values) => handleUpdate(card.id, values)}
                  onCancel={() => setEditingId(null)}
                />
              </Card>
            );
          }
          const brandName = card.brandId ? brands.find((brand) => brand.id === card.brandId)?.name : null;
          const tiles = metricTiles(card, ADMIN_METRIC_LABELS);
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
                    {card.category}
                  </span>
                  {card.featured && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-white px-1 text-[10px]" title="Destacada en Colaboraciones">
                      ★
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-sp-2">
                  <p className="line-clamp-2 text-sm font-bold text-ink">{card.caption}</p>
                  <p className="text-[11px] text-ink/55">
                    {platformLabel(card.platform as Platform)} · {card.type === "video" ? "Video" : "Foto"}
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
                      <span className="mr-1 font-mono text-[8px] uppercase text-lime">Lo que dicen</span>
                      “{card.topComment}”
                    </p>
                  )}
                  <p className="text-[10px] text-ink/45">
                    {card.metricsSyncedAt
                      ? `Métricas sincronizadas el ${formatShortDate(card.metricsSyncedAt)}`
                      : "Métricas manuales"}
                    {!card.showMetrics && " · ocultas en el sitio"}
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
                      showToast("success", "Métricas guardadas");
                    }
                  }}
                />
              )}

              <div className="flex flex-wrap items-center gap-sp-3 border-t border-line pt-sp-2 text-sm">
                {typeFilter === "all" && (
                  <ReorderButtons
                    onUp={() => handleMove(index, "up")}
                    onDown={() => handleMove(index, "down")}
                    disableUp={index === 0}
                    disableDown={index === cards.length - 1}
                  />
                )}
                <button type="button" onClick={() => setEditingId(card.id)} className={accentLinkClass}>
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setMetricsFor(metricsFor === card.id ? null : card.id)}
                  className={accentLinkClass}
                >
                  Métricas
                </button>
                {card.brandId && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (await saveMetrics(card.id, { featured: !card.featured })) {
                        showToast("success", card.featured ? "Ya no está destacada" : "Destacada en Colaboraciones");
                      }
                    }}
                    className="text-sm font-medium text-ink/60 hover:text-ink"
                  >
                    {card.featured ? "★ Destacada" : "☆ Destacar"}
                  </button>
                )}
                <button type="button" onClick={() => setPendingDelete(card)} className={`${dangerLinkClass} ml-auto`}>
                  Eliminar
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar tarjeta"
          description={`¿Eliminar "${pendingDelete.caption}"?`}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

const METRIC_FIELDS = [
  { key: "views", label: "Vistas" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comentarios" },
  { key: "shares", label: "Compartidos" },
  { key: "saves", label: "Guardados" },
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
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(METRIC_FIELDS.map((f) => [f.key, card[f.key] == null ? "" : String(card[f.key])]))
  );
  const [topComment, setTopComment] = useState(card.topComment ?? "");
  const [topCommentEn, setTopCommentEn] = useState(card.topCommentEn ?? "");
  const [author, setAuthor] = useState(card.topCommentAuthor ?? "");
  const [showMetrics, setShowMetrics] = useState(card.showMetrics);
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
    await onSave({ ...numbers, topComment, topCommentEn, topCommentAuthor: author, showMetrics });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sp-3 rounded-[14px] bg-cream p-sp-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-coral">Métricas y comentario destacado</p>
      <div className="grid grid-cols-2 gap-sp-2 sm:grid-cols-5">
        {METRIC_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-ink/70">{field.label}</span>
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
          <span className="text-[11px] font-medium text-ink/70">Lo que dicen (comentario destacado)</span>
          <input value={topComment} onChange={(e) => setTopComment(e.target.value)} className={inputClass} placeholder="¿Qué base usaste? La necesito ya 😍" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-ink/70">En inglés (opcional)</span>
          <input value={topCommentEn} onChange={(e) => setTopCommentEn(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-ink/70">Quién lo dijo</span>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} placeholder="@valeria.mua" />
        </label>
      </div>
      <label className="flex items-center gap-sp-2 text-sm text-ink">
        <input type="checkbox" checked={showMetrics} onChange={(e) => setShowMetrics(e.target.checked)} />
        Mostrar las métricas en el sitio público
      </label>
      <p className="text-[11px] text-ink/50">
        El engagement se calcula solo: (likes + comentarios + compartidos + guardados) ÷ vistas. Al sincronizar, solo se
        reemplazan los números que la red devuelve.
      </p>
      <div className="flex gap-sp-2">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? "Guardando…" : "Guardar métricas"}
        </button>
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
