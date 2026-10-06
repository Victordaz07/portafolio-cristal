"use client";

import { useState } from "react";
import type { Testimonial } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import ImageUploadField from "@/components/admin/ImageUploadField";
import BilingualTextField from "@/components/admin/BilingualTextField";
import { swapOrder } from "@/lib/reorder";
import { inputClass, primaryButtonClass, rowCardClass, cardClass, dangerLinkClass } from "@/lib/admin-ui";
import { QuoteIcon } from "@/components/icons";
import { useT } from "@/components/admin/AdminLang";

const API_BASE = "/api/admin/testimonials";

const EMPTY = { quote: "", quoteEn: "", name: "", role: "", roleEn: "", photoUrl: "" };

export default function TestimonialsManager({
  initialTestimonials,
}: {
  initialTestimonials: Testimonial[];
}) {
  const { t, lang } = useT();
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
      showToast("error", data.error ?? t("No se pudo agregar el testimonio", "Couldn't add the testimonial"));
      return;
    }

    const created: Testimonial = await response.json();
    setTestimonials((current) => [...current, created]);
    setForm(EMPTY);
    showToast("success", t("Testimonio agregado", "Testimonial added"));
  }

  async function handleDelete(testimonial: Testimonial) {
    const response = await fetch(`${API_BASE}/${testimonial.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", t("No se pudo eliminar", "Couldn't delete"));
      return;
    }
    setTestimonials((current) => current.filter((item) => item.id !== testimonial.id));
    showToast("success", t("Testimonio eliminado", "Testimonial deleted"));
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(testimonials, index, direction, API_BASE);
    setTestimonials(next);
  }

  return (
    <div>
      <ul className="flex flex-col gap-sp-3">
        {testimonials.map((testimonial, index) => (
          <li key={testimonial.id} className={rowCardClass}>
            <ReorderButtons
              onUp={() => handleMove(index, "up")}
              onDown={() => handleMove(index, "down")}
              disableUp={index === 0}
              disableDown={index === testimonials.length - 1}
            />
            {testimonial.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={testimonial.photoUrl}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime/25 text-coral">
                <QuoteIcon className="h-4 w-4" />
              </span>
            )}
            <div className="flex-1">
              <p className="text-sm text-ink/70">&quot;{(lang === "en" && testimonial.quoteEn) || testimonial.quote}&quot;</p>
              <p className="text-sm font-medium text-ink">
                {testimonial.name} <span className="text-ink/50">— {(lang === "en" && testimonial.roleEn) || testimonial.role}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingDelete(testimonial)}
              className={dangerLinkClass}
            >
              {t("Eliminar", "Delete")}
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className={`${cardClass} mt-sp-6 flex flex-col gap-sp-4 max-w-lg`}>
        <BilingualTextField
          label={t("Cita", "Quote")}
          es={form.quote}
          en={form.quoteEn}
          onEsChange={(v) => set("quote", v)}
          onEnChange={(v) => set("quoteEn", v)}
          multiline
          rows={3}
          required
        />
        <div className="grid gap-sp-4 sm:grid-cols-2">
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">{t("Nombre", "Name")}</span>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </label>
          <BilingualTextField
            label={t("Rol / marca", "Role / brand")}
            es={form.role}
            en={form.roleEn}
            onEsChange={(v) => set("role", v)}
            onEnChange={(v) => set("roleEn", v)}
            required
          />
        </div>
        <ImageUploadField
          label={t("Foto (opcional)", "Photo (optional)")}
          value={form.photoUrl}
          onChange={(url) => set("photoUrl", url)}
          aspect={1}
          recommendedSize="400 × 400 px"
        />
        <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
          {saving ? t("Agregando...", "Adding...") : t("+ agregar testimonio", "+ add testimonial")}
        </button>
      </form>

      {pendingDelete && (
        <ConfirmDialog
          title={t("Eliminar testimonio", "Delete testimonial")}
          description={t(`¿Eliminar el testimonio de "${pendingDelete.name}"?`, `Delete the testimonial from "${pendingDelete.name}"?`)}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
