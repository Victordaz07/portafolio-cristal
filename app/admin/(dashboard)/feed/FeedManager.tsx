"use client";

import { useMemo, useState } from "react";
import type { ContentCard } from "@prisma/client";
import type { ContentType, Platform } from "@/lib/embeds";
import { platformLabel } from "@/lib/embeds";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import { swapOrder } from "@/lib/reorder";
import ContentCardForm, { type ContentCardFormValues } from "./ContentCardForm";

const API_BASE = "/api/admin/content-cards";

export default function FeedManager({ initialCards }: { initialCards: ContentCard[] }) {
  const { showToast } = useToast();
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

  return (
    <div>
      <div className="flex flex-col gap-sp-3">
        {cards.map((card, index) =>
          editingId === card.id ? (
            <div key={card.id} className="rounded-md border border-line bg-white p-sp-5">
              <ContentCardForm
                initial={{
                  type: card.type as ContentType,
                  platform: card.platform as Platform,
                  postUrl: card.postUrl,
                  videoUrl: card.videoUrl ?? "",
                  caption: card.caption,
                  captionEn: card.captionEn ?? "",
                  category: card.category,
                  categoryEn: card.categoryEn ?? "",
                  statPrimary: card.statPrimary ?? "",
                  statPrimaryEn: card.statPrimaryEn ?? "",
                  statSecondary: card.statSecondary ?? "",
                  statSecondaryEn: card.statSecondaryEn ?? "",
                }}
                existingCategories={categories}
                submitLabel="Guardar cambios"
                onSubmit={(values) => handleUpdate(card.id, values)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              key={card.id}
              className="flex items-center gap-sp-4 rounded-md border border-line bg-white px-sp-4 py-sp-3"
            >
              <ReorderButtons
                onUp={() => handleMove(index, "up")}
                onDown={() => handleMove(index, "down")}
                disableUp={index === 0}
                disableDown={index === cards.length - 1}
              />
              <div
                className={`shrink-0 rounded-sm bg-gradient-to-br from-cobalt to-cobalt-ink ${
                  card.type === "video" ? "aspect-[9/16] w-10" : "aspect-[4/5] w-12"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-ink">{card.caption}</p>
                <p className="font-mono text-xs uppercase tracking-wide text-moss">
                  {card.category} · {card.type} · {platformLabel(card.platform as Platform)}
                </p>
              </div>
              <div className="flex shrink-0 gap-sp-3 text-sm">
                <button
                  type="button"
                  onClick={() => setEditingId(card.id)}
                  className="text-coral hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(card)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <div className="mt-sp-6">
        {showCreate ? (
          <div className="rounded-md border border-line bg-white p-sp-5">
            <ContentCardForm
              existingCategories={categories}
              submitLabel="Agregar tarjeta"
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="text-sm text-coral hover:underline"
          >
            + agregar tarjeta
          </button>
        )}
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
