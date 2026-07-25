"use client";

import { useState } from "react";
import type { Review } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { swapOrder } from "@/lib/reorder";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";

const API_BASE = "/api/admin/reviews";

const EMPTY = { photoUrl: "", category: "", title: "", description: "", rating: 5 };

export default function ReviewsManager({ initialReviews }: { initialReviews: Review[] }) {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState(initialReviews);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Review | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo agregar la reseña");
      return;
    }

    const created: Review = await response.json();
    setReviews((current) => [...current, created]);
    setForm(EMPTY);
    showToast("success", "Reseña agregada");
  }

  async function handleDelete(review: Review) {
    const response = await fetch(`${API_BASE}/${review.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", "No se pudo eliminar");
      return;
    }
    setReviews((current) => current.filter((item) => item.id !== review.id));
    showToast("success", "Reseña eliminada");
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(reviews, index, direction, API_BASE);
    setReviews(next);
  }

  return (
    <div>
      <ul className="flex flex-col gap-sp-3">
        {reviews.map((review, index) => (
          <li
            key={review.id}
            className="flex items-center gap-sp-4 rounded-md border border-line bg-white px-sp-4 py-sp-3"
          >
            <ReorderButtons
              onUp={() => handleMove(index, "up")}
              onDown={() => handleMove(index, "down")}
              disableUp={index === 0}
              disableDown={index === reviews.length - 1}
            />
            {review.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={review.photoUrl} alt="" className="h-12 w-12 rounded object-cover" />
            )}
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-moss">{review.category}</p>
              <p className="font-medium text-ink">{review.title}</p>
              <p className="text-sm text-ink/60">{review.description}</p>
            </div>
            <span className="font-mono text-sm text-ink/60">{review.rating}★</span>
            <button
              type="button"
              onClick={() => setPendingDelete(review)}
              className="text-sm text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-sp-6 flex flex-col gap-sp-4 max-w-lg">
        <div className="grid gap-sp-4 sm:grid-cols-2">
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Categoría</span>
            <input
              required
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputClass}
              placeholder="Belleza"
            />
          </label>
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Calificación</span>
            <select
              value={form.rating}
              onChange={(e) => set("rating", Number(e.target.value))}
              className={inputClass}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} estrella{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Título (producto – marca)</span>
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputClass}
            placeholder="My Way – Giorgio Armani"
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Descripción</span>
          <textarea
            required
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={inputClass}
          />
        </label>
        <ImageUploadField label="Foto (opcional)" value={form.photoUrl} onChange={(url) => set("photoUrl", url)} />
        <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
          {saving ? "Agregando..." : "+ agregar reseña"}
        </button>
      </form>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar reseña"
          description={`¿Eliminar "${pendingDelete.title}"?`}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
