"use client";

import { useState } from "react";
import type { Testimonial } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { swapOrder } from "@/lib/reorder";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";

const API_BASE = "/api/admin/testimonials";

const EMPTY = { quote: "", name: "", role: "", photoUrl: "" };

export default function TestimonialsManager({
  initialTestimonials,
}: {
  initialTestimonials: Testimonial[];
}) {
  const { showToast } = useToast();
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Testimonial | null>(null);

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
      showToast("error", data.error ?? "No se pudo agregar el testimonio");
      return;
    }

    const created: Testimonial = await response.json();
    setTestimonials((current) => [...current, created]);
    setForm(EMPTY);
    showToast("success", "Testimonio agregado");
  }

  async function handleDelete(testimonial: Testimonial) {
    const response = await fetch(`${API_BASE}/${testimonial.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", "No se pudo eliminar");
      return;
    }
    setTestimonials((current) => current.filter((item) => item.id !== testimonial.id));
    showToast("success", "Testimonio eliminado");
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(testimonials, index, direction, API_BASE);
    setTestimonials(next);
  }

  return (
    <div>
      <ul className="flex flex-col gap-sp-3">
        {testimonials.map((testimonial, index) => (
          <li
            key={testimonial.id}
            className="flex items-center gap-sp-4 rounded-md border border-line bg-white px-sp-4 py-sp-3"
          >
            <ReorderButtons
              onUp={() => handleMove(index, "up")}
              onDown={() => handleMove(index, "down")}
              disableUp={index === 0}
              disableDown={index === testimonials.length - 1}
            />
            {testimonial.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={testimonial.photoUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <p className="text-sm text-ink/70">&quot;{testimonial.quote}&quot;</p>
              <p className="text-sm font-medium text-ink">
                {testimonial.name} <span className="text-ink/50">— {testimonial.role}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingDelete(testimonial)}
              className="text-sm text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-sp-6 flex flex-col gap-sp-4 max-w-lg">
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Cita</span>
          <textarea
            required
            rows={3}
            value={form.quote}
            onChange={(e) => set("quote", e.target.value)}
            className={inputClass}
          />
        </label>
        <div className="grid gap-sp-4 sm:grid-cols-2">
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Nombre</span>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Rol / marca</span>
            <input
              required
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className={inputClass}
              placeholder="Gerente de Marketing – IUNIK"
            />
          </label>
        </div>
        <ImageUploadField
          label="Foto (opcional)"
          value={form.photoUrl}
          onChange={(url) => set("photoUrl", url)}
        />
        <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
          {saving ? "Agregando..." : "+ agregar testimonio"}
        </button>
      </form>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar testimonio"
          description={`¿Eliminar el testimonio de "${pendingDelete.name}"?`}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
