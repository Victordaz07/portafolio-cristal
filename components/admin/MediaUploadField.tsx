"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { useToast } from "./ToastContext";
import ImageCropModal, { type AspectOption } from "./ImageCropModal";
import { cropMimeFor, extensionFor } from "@/lib/image-crop";
import { MAX_VIDEO_BYTES, MAX_PHOTO_BYTES, formatMb } from "@/lib/upload-limits";

const DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

function sanitizePathname(kind: "video" | "photo", fileName: string) {
  const sanitized = fileName
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
  return `content-cards/${kind}/${Date.now()}-${sanitized}`;
}

export default function MediaUploadField({
  label,
  value,
  onChange,
  kind,
  aspect,
  recommendedSize,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind: "video" | "photo";
  /** Solo aplica a fotos: fija (o deja elegir, con una lista) la forma del recorte antes de subir. */
  aspect?: number | AspectOption[];
  /** Texto corto de la medida ideal, ej. "1080 × 1350 px". */
  recommendedSize?: string;
}) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropIsNewFile, setCropIsNewFile] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const noun = kind === "video" ? "el video" : "la foto";
  const aspectOptions: AspectOption[] | null =
    kind === "photo" && aspect != null ? (Array.isArray(aspect) ? aspect : [{ label: "Recorte", value: aspect }]) : null;

  async function uploadFile(file: File) {
    const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
    if (file.size > maxBytes) {
      showToast(
        "error",
        `${kind === "video" ? "El video" : "La foto"} pesa demasiado (máximo ${formatMb(maxBytes)}). Comprímelo o achícalo e inténtalo de nuevo.`
      );
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const blob = await upload(sanitizePathname(kind, file.name), file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        clientPayload: JSON.stringify({ kind }),
        multipart: true,
        onUploadProgress: (event) => setProgress(Math.round(event.percentage)),
      });
      onChange(blob.url);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : `No se pudo subir ${noun}`);
    } finally {
      setUploading(false);
    }
  }

  function handleFile(file: File) {
    const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
    if (file.size > maxBytes) {
      showToast(
        "error",
        `${kind === "video" ? "El video" : "La foto"} pesa demasiado (máximo ${formatMb(maxBytes)}). Comprímelo o achícalo e inténtalo de nuevo.`
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

  const formatHint = kind === "video" ? "MP4 o MOV" : "JPG, PNG o WebP";

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
          const expected = kind === "video" ? "video/" : "image/";
          if (file && file.type.startsWith(expected)) handleFile(file);
          else if (file) showToast("error", kind === "video" ? "Ese archivo no es un video" : "Ese archivo no es una imagen");
        }}
        className={`group flex cursor-pointer flex-wrap items-center gap-sp-3 rounded-[14px] border border-dashed p-sp-3 transition ${
          dragging ? "border-coral bg-coral/5" : "border-line bg-white hover:border-coral"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-cream">
          {value ? (
            kind === "video" ? (
              <video src={value} muted className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden className="h-7 w-7 text-ink/35" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <circle cx="9" cy="10" r="1.8" />
              <path d="M21 16l-5-5-8 8" />
            </svg>
          )}
        </span>
        <span className="flex min-w-[150px] flex-1 flex-col gap-1">
          <span className="inline-flex w-fit items-center whitespace-nowrap rounded-full bg-ink px-sp-4 py-1.5 text-xs font-semibold text-cream group-hover:bg-coral">
            {uploading ? `Subiendo… ${progress}%` : value ? `Cambiar ${kind === "video" ? "video" : "foto"}` : `Elegir ${kind === "video" ? "video" : "foto"}`}
          </span>
          <span className="text-xs text-ink/55">
            o arrástralo aquí · {recommendedSize ? `ideal ${recommendedSize} · ` : ""}{formatHint} · máx. {formatMb(maxBytesFor(kind))}
          </span>
        </span>
        <input
          type="file"
          accept={kind === "video" ? "video/*" : "image/*"}
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
            <button
              type="button"
              onClick={() => {
                setCropIsNewFile(false);
                setCropSrc(value);
              }}
              className="w-fit text-xs text-ink/55 hover:text-coral"
            >
              Ajustar encuadre
            </button>
          )}
          <button type="button" onClick={() => onChange("")} className="w-fit text-xs text-ink/50 hover:text-red-600">
            Quitar {kind === "video" ? "video" : "foto"}
          </button>
        </div>
      )}

      {cropSrc && aspectOptions && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspectOptions={aspectOptions}
          mimeType={cropMimeFor(pendingFile ?? cropSrc, false)}
          onCancel={closeCrop}
          onConfirm={confirmCrop}
          onSkip={cropIsNewFile ? skipCrop : undefined}
        />
      )}
    </div>
  );
}

function maxBytesFor(kind: "video" | "photo") {
  return kind === "video" ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
}
