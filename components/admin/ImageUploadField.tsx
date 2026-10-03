"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { useToast } from "./ToastContext";
import ImageCropModal, { type AspectOption } from "./ImageCropModal";
import { cropMimeFor, extensionFor } from "@/lib/image-crop";
import { MAX_PHOTO_BYTES, formatMb } from "@/lib/upload-limits";

const DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

function sanitizePathname(fileName: string) {
  const sanitized = fileName
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
  return `site-images/${Date.now()}-${sanitized}`;
}

function toAspectOptions(aspect: number | AspectOption[] | undefined): AspectOption[] | null {
  if (aspect == null) return null;
  return Array.isArray(aspect) ? aspect : [{ label: "Recorte", value: aspect }];
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  aspect,
  recommendedSize,
  outputFormat = "jpeg",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Si se da, al elegir la foto se abre un recorte antes de subirla. Un número fija la forma (ej. 4/5); una lista deja elegir entre varias (ej. logos). */
  aspect?: number | AspectOption[];
  /** Texto corto de la medida ideal, ej. "1200 × 1500 px". */
  recommendedSize?: string;
  /** "png" conserva transparencia (logos); "jpeg" (por defecto) pesa menos para fotos. */
  outputFormat?: "jpeg" | "png";
}) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropIsNewFile, setCropIsNewFile] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const aspectOptions = toAspectOptions(aspect);

  async function uploadFile(file: File) {
    if (file.size > MAX_PHOTO_BYTES) {
      showToast(
        "error",
        `La imagen pesa demasiado (máximo ${formatMb(MAX_PHOTO_BYTES)}). Comprímela o achícala e inténtalo de nuevo.`
      );
      return;
    }
    setUploading(true);
    try {
      const blob = await upload(sanitizePathname(file.name), file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        clientPayload: JSON.stringify({ kind: "photo" }),
        multipart: true,
      });
      onChange(blob.url);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  function handleFile(file: File) {
    if (file.size > MAX_PHOTO_BYTES) {
      showToast(
        "error",
        `La imagen pesa demasiado (máximo ${formatMb(MAX_PHOTO_BYTES)}). Comprímela o achícala e inténtalo de nuevo.`
      );
      return;
    }
    if (aspectOptions) {
      setCropIsNewFile(true);
      setPendingFile(file);
      setCropSrc(URL.createObjectURL(file));
      return;
    }
    uploadFile(file);
  }

  function openCropForExisting() {
    if (!value) return;
    setCropIsNewFile(false);
    setCropSrc(value);
  }

  function closeCrop() {
    if (cropIsNewFile && cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFile(null);
  }

  async function skipCrop() {
    const file = pendingFile;
    closeCrop();
    if (file) await uploadFile(file);
  }

  async function confirmCrop(blob: Blob) {
    await uploadFile(new File([blob], `recorte-${Date.now()}.${extensionFor(blob)}`, { type: blob.type }));
    closeCrop();
  }

  return (
    <div className="flex flex-col gap-sp-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file && file.type.startsWith("image/")) handleFile(file);
          else if (file) showToast("error", "Ese archivo no es una imagen");
        }}
        className={`group flex cursor-pointer flex-wrap items-center gap-sp-3 rounded-[14px] border border-dashed p-sp-3 transition ${
          dragging ? "border-coral bg-coral/5" : "border-line bg-white hover:border-coral"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-cream">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden className="h-7 w-7 text-ink/35" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <circle cx="9" cy="10" r="1.8" />
              <path d="M21 16l-5-5-8 8" />
            </svg>
          )}
        </span>
        {/* Si no cabe al lado de la foto (columnas angostas), el texto baja debajo en vez de apretarse. */}
        <span className="flex min-w-[150px] flex-1 flex-col gap-1">
          <span className="inline-flex w-fit items-center whitespace-nowrap rounded-full bg-ink px-sp-4 py-1.5 text-xs font-semibold text-cream group-hover:bg-coral">
            {uploading ? "Subiendo…" : value ? "Cambiar foto" : "Elegir foto"}
          </span>
          <span className="text-xs text-ink/55">
            o arrástrala aquí · {recommendedSize ? `ideal ${recommendedSize} · ` : ""}JPG, PNG o WebP · máx. {formatMb(MAX_PHOTO_BYTES)}
          </span>
        </span>
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
            event.target.value = "";
          }}
          className="sr-only"
        />
      </label>
      {value && !uploading && (
        <div className="flex gap-sp-4">
          {aspectOptions && (
            <button type="button" onClick={openCropForExisting} className="w-fit text-xs text-ink/55 hover:text-coral">
              Ajustar encuadre
            </button>
          )}
          <button type="button" onClick={() => onChange("")} className="w-fit text-xs text-ink/50 hover:text-red-600">
            Quitar foto
          </button>
        </div>
      )}

      {cropSrc && aspectOptions && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspectOptions={aspectOptions}
          mimeType={cropMimeFor(pendingFile ?? cropSrc, outputFormat === "png")}
          onCancel={closeCrop}
          onConfirm={confirmCrop}
          onSkip={cropIsNewFile ? skipCrop : undefined}
        />
      )}
    </div>
  );
}
