"use client";

import { useState } from "react";
import type { Platform, ContentType } from "@/lib/embeds";
import EmbedUrlInput from "@/components/admin/EmbedUrlInput";
import MediaUploadField from "@/components/admin/MediaUploadField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import BilingualTextField from "@/components/admin/BilingualTextField";
import { useToast } from "@/components/admin/ToastContext";
import { TikTokIcon, InstagramIcon, FacebookIcon } from "@/components/icons";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";

type SocialPlatform = Exclude<Platform, "ugc">;

const PLATFORM_OPTIONS: SocialPlatform[] = ["tiktok", "instagram", "facebook"];

const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
};

const PLATFORM_ICONS: Record<SocialPlatform, (props: { className?: string }) => JSX.Element> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
};

export interface ContentCardFormValues {
  type: ContentType;
  platform: Platform;
  postUrl: string;
  videoUrl: string;
  photoUrl: string;
  thumbnailUrl: string;
  caption: string;
  captionEn: string;
  category: string;
  categoryEn: string;
  statPrimary: string;
  statPrimaryEn: string;
  statSecondary: string;
  statSecondaryEn: string;
  brandId: string;
}

export interface BrandOption {
  id: string;
  name: string;
  logoUrl: string | null;
}

const NEW_CATEGORY_VALUE = "__new__";
const NEW_BRAND_VALUE = "__new_brand__";

export default function ContentCardForm({
  initial,
  existingCategories,
  existingBrands,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: ContentCardFormValues;
  existingCategories: string[];
  existingBrands: BrandOption[];
  submitLabel: string;
  onSubmit: (values: ContentCardFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [mode, setMode] = useState<"social" | "ugc">(initial?.platform === "ugc" ? "ugc" : "social");
  const [postUrl, setPostUrl] = useState(initial?.postUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "");
  const [platform, setPlatform] = useState<Platform | null>(
    initial?.platform && initial.platform !== "ugc" ? initial.platform : null
  );
  const [type, setType] = useState<ContentType | null>(
    initial?.platform === "ugc" ? "photo" : initial?.type ?? null
  );
  const { showToast } = useToast();
  const [brands, setBrands] = useState(existingBrands);
  const [brandId, setBrandId] = useState(initial?.brandId ?? "");
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandLogoUrl, setNewBrandLogoUrl] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);

  async function handleCreateBrand() {
    if (!newBrandName.trim()) return;
    setCreatingBrand(true);
    try {
      const response = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBrandName.trim(), logoUrl: newBrandLogoUrl, websiteUrl: "", active: true }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast("error", data.error ?? "No se pudo crear la marca");
        return;
      }
      const created = await response.json();
      setBrands((current) => [...current, { id: created.id, name: created.name, logoUrl: created.logoUrl }]);
      setBrandId(created.id);
      setShowNewBrand(false);
      setNewBrandName("");
      setNewBrandLogoUrl("");
      showToast("success", "Marca creada");
    } finally {
      setCreatingBrand(false);
    }
  }
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

  function handleModeChange(next: "social" | "ugc") {
    setMode(next);
    if (next === "ugc") {
      setType("photo");
      setPlatform("ugc");
      setPostUrl("");
      setVideoUrl("");
    } else {
      setPlatform(null);
      setType(null);
      setBrandId("");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "ugc") {
      if (!photoUrl) return;
    } else if (!platform || !type || (!postUrl && !videoUrl && !photoUrl)) {
      return;
    }
    setSaving(true);
    await onSubmit({
      type: type ?? "photo",
      platform: mode === "ugc" ? "ugc" : platform ?? "instagram",
      postUrl,
      videoUrl,
      photoUrl,
      thumbnailUrl: mode === "social" ? thumbnailUrl : "",
      caption,
      captionEn,
      category,
      categoryEn,
      statPrimary,
      statPrimaryEn,
      statSecondary,
      statSecondaryEn,
      brandId: mode === "ugc" ? brandId : "",
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
      <div className="flex flex-col gap-sp-1 max-w-md">
        <span className="text-sm font-medium text-ink">Tipo de tarjeta</span>
        <div className="flex gap-sp-2">
          <button
            type="button"
            onClick={() => handleModeChange("social")}
            className={`flex-1 rounded-md border px-sp-3 py-sp-2 text-sm transition ${
              mode === "social" ? "border-coral bg-coral/10 text-ink" : "border-line text-ink/60 hover:border-coral"
            }`}
          >
            Post de red social
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("ugc")}
            className={`flex-1 rounded-md border px-sp-3 py-sp-2 text-sm transition ${
              mode === "ugc" ? "border-coral bg-coral/10 text-ink" : "border-line text-ink/60 hover:border-coral"
            }`}
          >
            Foto UGC de portafolio (sin red social)
          </button>
        </div>
        <span className="text-xs text-ink/50">
          {mode === "ugc"
            ? "Solo sube la foto, describe el trabajo y opcionalmente marca la marca para la que lo hiciste. No necesita link a ninguna red social."
            : "Vincula un post existente de TikTok, Instagram o Facebook, o sube tu propio video/foto."}
        </span>
      </div>

      {mode === "ugc" && (
        <div className="flex flex-col gap-sp-1 max-w-xs">
          <span className="text-sm font-medium text-ink">Marca (opcional)</span>
          {!showNewBrand && (
            <>
              <select
                value={brandId}
                onChange={(e) => {
                  if (e.target.value === NEW_BRAND_VALUE) {
                    setShowNewBrand(true);
                  } else {
                    setBrandId(e.target.value);
                  }
                }}
                className={inputClass}
              >
                <option value="">Sin marca</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
                <option value={NEW_BRAND_VALUE}>+ agregar nueva marca</option>
              </select>
              <span className="text-xs text-ink/50">
                Si la marca tiene logo cargado, se mostrará sobre la foto.
              </span>
            </>
          )}

          {showNewBrand && (
            <div className="flex flex-col gap-sp-3 rounded-md border border-line bg-cream p-sp-4">
              <label className="flex flex-col gap-sp-1">
                <span className="text-sm font-medium text-ink">Nombre de la marca</span>
                <input
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Nombre de la marca"
                  className={inputClass}
                />
              </label>
              <ImageUploadField label="Logo (opcional)" value={newBrandLogoUrl} onChange={setNewBrandLogoUrl} />
              <div className="flex gap-sp-3">
                <button
                  type="button"
                  disabled={creatingBrand || !newBrandName.trim()}
                  onClick={handleCreateBrand}
                  className={secondaryButtonClass}
                >
                  {creatingBrand ? "Creando..." : "Crear marca"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewBrand(false);
                    setNewBrandName("");
                    setNewBrandLogoUrl("");
                  }}
                  className="text-sm text-ink/60 hover:underline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "social" && (
        <>
          <EmbedUrlInput
            url={postUrl}
            platform={platform}
            type={type}
            onUrlChange={(value, detected) => {
              setPostUrl(value);
              setPlatform(detected.platform);
              setType(detected.inferredType);
            }}
            onThumbnailResolved={(resolvedThumbnailUrl) => {
              if (resolvedThumbnailUrl) setThumbnailUrl(resolvedThumbnailUrl);
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
              {platform && platform !== "ugc" && (
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
        </>
      )}

      {mode === "social" && !type && (
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
        <MediaUploadField
          kind="video"
          label={
            postUrl
              ? "Video propio (opcional): súbelo aquí para que se reproduzca directo en el sitio, sin depender del embed de la plataforma"
              : "Sube el video: como no hay URL de post, esto es obligatorio para que la tarjeta tenga contenido"
          }
          value={videoUrl}
          onChange={setVideoUrl}
        />
      )}

      {mode === "social" && type === "video" && (
        <ImageUploadField
          label="Miniatura (opcional): sube una foto/screenshot para la vista previa en la cuadrícula. TikTok normalmente ya trae una automática; Instagram y Facebook no, así que se recomienda subir una aquí."
          value={thumbnailUrl}
          onChange={setThumbnailUrl}
        />
      )}

      {type === "photo" && (
        <MediaUploadField
          kind="photo"
          label={
            postUrl
              ? "Foto propia (opcional): súbela aquí para que se muestre directo en el sitio, sin depender del embed de la plataforma"
              : "Sube la foto: como no hay URL de post, esto es obligatorio para que la tarjeta tenga contenido"
          }
          value={photoUrl}
          onChange={setPhotoUrl}
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
          disabled={saving || !platform || !type || !category || (!postUrl && !videoUrl && !photoUrl)}
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
