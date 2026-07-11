"use client";

import { useState } from "react";
import type { Platform, ContentType } from "@/lib/embeds";
import EmbedUrlInput from "@/components/admin/EmbedUrlInput";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

export interface ContentCardFormValues {
  type: ContentType;
  platform: Platform;
  postUrl: string;
  caption: string;
  category: string;
  statPrimary: string;
  statSecondary: string;
}

const NEW_CATEGORY_VALUE = "__new__";

export default function ContentCardForm({
  initial,
  existingCategories,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: ContentCardFormValues;
  existingCategories: string[];
  submitLabel: string;
  onSubmit: (values: ContentCardFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [postUrl, setPostUrl] = useState(initial?.postUrl ?? "");
  const [platform, setPlatform] = useState<Platform | null>(initial?.platform ?? null);
  const [type, setType] = useState<ContentType | null>(initial?.type ?? null);
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [category, setCategory] = useState(initial?.category ?? existingCategories[0] ?? "");
  const [isNewCategory, setIsNewCategory] = useState(
    initial ? !existingCategories.includes(initial.category) : existingCategories.length === 0
  );
  const [statPrimary, setStatPrimary] = useState(initial?.statPrimary ?? "");
  const [statSecondary, setStatSecondary] = useState(initial?.statSecondary ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!platform || !type) return;
    setSaving(true);
    await onSubmit({ type, platform, postUrl, caption, category, statPrimary, statSecondary });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
      <EmbedUrlInput
        url={postUrl}
        platform={platform}
        type={type}
        onUrlChange={(value, detected) => {
          setPostUrl(value);
          setPlatform(detected.platform);
          setType(detected.inferredType);
        }}
      />

      {platform && !type && (
        <label className="flex flex-col gap-sp-1 max-w-xs">
          <span className="text-sm font-medium text-ink">
            No pude detectar el tipo de contenido — selecciónalo:
          </span>
          <select
            required
            value={type ?? ""}
            onChange={(e) => setType(e.target.value as ContentType)}
            className={inputClass}
          >
            <option value="" disabled>
              Elegir...
            </option>
            <option value="video">Video</option>
            <option value="photo">Foto</option>
          </select>
        </label>
      )}

      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Descripción / caption</span>
        <textarea
          required
          rows={2}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={inputClass}
        />
      </label>

      <div className="flex flex-col gap-sp-1 max-w-xs">
        <span className="text-sm font-medium text-ink">Categoría</span>
        {isNewCategory ? (
          <div className="flex gap-sp-2">
            <input
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Nueva categoría"
              className={inputClass}
            />
            {existingCategories.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsNewCategory(false);
                  setCategory(existingCategories[0]);
                }}
                className="text-sm text-ink/60 hover:underline"
              >
                Cancelar
              </button>
            )}
          </div>
        ) : (
          <select
            value={category}
            onChange={(e) => {
              if (e.target.value === NEW_CATEGORY_VALUE) {
                setIsNewCategory(true);
                setCategory("");
              } else {
                setCategory(e.target.value);
              }
            }}
            className={inputClass}
          >
            {existingCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value={NEW_CATEGORY_VALUE}>+ nueva categoría</option>
          </select>
        )}
      </div>

      <div className="grid gap-sp-4 sm:grid-cols-2">
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">
            {type === "photo" ? "Likes (opcional)" : "Views (opcional)"}
          </span>
          <input
            value={statPrimary}
            onChange={(e) => setStatPrimary(e.target.value)}
            className={inputClass}
            placeholder={type === "photo" ? "3.2K likes" : "120K views"}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">
            {type === "photo" ? "Saves (opcional)" : "Engagement rate (opcional)"}
          </span>
          <input
            value={statSecondary}
            onChange={(e) => setStatSecondary(e.target.value)}
            className={inputClass}
            placeholder={type === "photo" ? "410 saves" : "9.4% ER"}
          />
        </label>
      </div>

      <div className="flex gap-sp-3">
        <button
          type="submit"
          disabled={saving || !platform || !type || !category}
          className={primaryButtonClass}
        >
          {saving ? "Guardando..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
