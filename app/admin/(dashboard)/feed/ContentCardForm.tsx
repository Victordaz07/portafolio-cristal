"use client";

import { useState } from "react";
import type { Platform, ContentType } from "@/lib/embeds";
import EmbedUrlInput from "@/components/admin/EmbedUrlInput";
import VideoUploadField from "@/components/admin/VideoUploadField";
import BilingualTextField from "@/components/admin/BilingualTextField";
import { TikTokIcon, InstagramIcon, FacebookIcon } from "@/components/icons";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

const PLATFORM_OPTIONS: Platform[] = ["tiktok", "instagram", "facebook"];

const PLATFORM_NAMES: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
};

const PLATFORM_ICONS: Record<Platform, (props: { className?: string }) => JSX.Element> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
};

export interface ContentCardFormValues {
  type: ContentType;
  platform: Platform;
  postUrl: string;
  videoUrl: string;
  caption: string;
  captionEn: string;
  category: string;
  categoryEn: string;
  statPrimary: string;
  statPrimaryEn: string;
  statSecondary: string;
  statSecondaryEn: string;
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
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [platform, setPlatform] = useState<Platform | null>(initial?.platform ?? null);
  const [type, setType] = useState<ContentType | null>(initial?.type ?? null);
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [captionEn, setCaptionEn] = useState(initial?.captionEn ?? "");
  const [category, setCategory] = useState(initial?.category ?? existingCategories[0] ?? "");
  const [categoryEn, setCategoryEn] = useState(initial?.categoryEn ?? "");
  const [isNewCategory, setIsNewCategory] = useState(
    initial ? !existingCategories.includes(initial.category) : existingCategories.length === 0
  );
  const [statPrimary, setStatPrimary] = useState(initial?.statPrimary ?? "");
  const [statPrimaryEn, setStatPrimaryEn] = useState(initial?.statPrimaryEn ?? "");
  const [statSecondary, setStatSecondary] = useState(initial?.statSecondary ?? "");
  const [statSecondaryEn, setStatSecondaryEn] = useState(initial?.statSecondaryEn ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!platform || !type || (!postUrl && !videoUrl)) return;
    setSaving(true);
    await onSubmit({
      type,
      platform,
      postUrl,
      videoUrl,
      caption,
      captionEn,
      category,
      categoryEn,
      statPrimary,
      statPrimaryEn,
      statSecondary,
      statSecondaryEn,
    });
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

      <div className="flex flex-col gap-sp-1 max-w-xs">
        <span className="text-sm font-medium text-ink">
          Ícono de plataforma que se muestra en la tarjeta
        </span>
        <div className="flex items-center gap-sp-3">
          <select
            required
            value={platform ?? ""}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className={`${inputClass} flex-1`}
          >
            <option value="" disabled>
              Elegir...
            </option>
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PLATFORM_NAMES[option]}
              </option>
            ))}
          </select>
          {platform && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-line">
              {(() => {
                const PlatformIcon = PLATFORM_ICONS[platform];
                return <PlatformIcon className="h-4 w-4" />;
              })()}
            </span>
          )}
        </div>
        <span className="text-xs text-ink/50">
          Se detecta automáticamente al pegar la URL, pero puedes cambiarlo aquí si el ícono no es el correcto.
        </span>
      </div>

      {!type && (
        <label className="flex flex-col gap-sp-1 max-w-xs">
          <span className="text-sm font-medium text-ink">
            Tipo de contenido {postUrl ? "— no pude detectarlo, selecciónalo:" : ""}
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

      {type === "video" && (
        <VideoUploadField
          label={
            postUrl
              ? "Video propio (opcional): súbelo aquí para que se reproduzca directo en el sitio, sin depender del embed de la plataforma"
              : "Sube el video: como no hay URL de post, esto es obligatorio para que la tarjeta tenga contenido"
          }
          value={videoUrl}
          onChange={setVideoUrl}
        />
      )}

      <BilingualTextField
        label="Descripción / caption"
        es={caption}
        en={captionEn}
        onEsChange={setCaption}
        onEnChange={setCaptionEn}
        multiline
        rows={2}
        required
      />

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
        <input
          value={categoryEn}
          onChange={(e) => setCategoryEn(e.target.value)}
          placeholder="Category (English)"
          className={inputClass}
        />
      </div>

      <div className="grid gap-sp-4 sm:grid-cols-2">
        <BilingualTextField
          label={type === "photo" ? "Likes (opcional)" : "Views (opcional)"}
          es={statPrimary}
          en={statPrimaryEn}
          onEsChange={setStatPrimary}
          onEnChange={setStatPrimaryEn}
        />
        <BilingualTextField
          label={type === "photo" ? "Saves (opcional)" : "Engagement rate (opcional)"}
          es={statSecondary}
          en={statSecondaryEn}
          onEsChange={setStatSecondary}
          onEnChange={setStatSecondaryEn}
        />
      </div>

      <div className="flex gap-sp-3">
        <button
          type="submit"
          disabled={saving || !platform || !type || !category || (!postUrl && !videoUrl)}
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
