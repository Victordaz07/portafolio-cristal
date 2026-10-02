"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { useToast } from "./ToastContext";
import { MAX_PHOTO_BYTES, formatMb } from "@/lib/upload-limits";

const DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

function sanitizePathname(fileName: string) {
  const sanitized = fileName
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
  return `site-images/${Date.now()}-${sanitized}`;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
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
        className={`group flex cursor-pointer items-center gap-sp-4 rounded-[14px] border border-dashed p-sp-3 transition ${
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
        <span className="flex min-w-0 flex-col gap-1">
          <span className="inline-flex w-fit items-center rounded-full bg-ink px-sp-4 py-1.5 text-xs font-semibold text-cream group-hover:bg-coral">
            {uploading ? "Subiendo…" : value ? "Cambiar foto" : "Elegir foto"}
          </span>
          <span className="text-xs text-ink/55">
            o arrástrala aquí · JPG, PNG o WebP · máx. {formatMb(MAX_PHOTO_BYTES)}
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
        <button type="button" onClick={() => onChange("")} className="w-fit text-xs text-ink/50 hover:text-red-600">
          Quitar foto
        </button>
      )}
    </div>
  );
}
