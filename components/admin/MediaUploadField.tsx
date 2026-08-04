"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { useToast } from "./ToastContext";
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
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind: "video" | "photo";
}) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const noun = kind === "video" ? "el video" : "la foto";

  async function handleFile(file: File) {
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

  return (
    <div className="flex flex-col gap-sp-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      {value &&
        (kind === "video" ? (
          <video src={value} controls muted className="h-40 w-auto rounded-sm object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-40 w-auto rounded-sm object-cover" />
        ))}
      <input
        type="file"
        accept={kind === "video" ? "video/*" : "image/*"}
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="text-sm text-ink/70"
      />
      {uploading && <span className="text-xs text-moss">Subiendo... {progress}%</span>}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="self-start text-xs text-red-600 hover:underline"
        >
          Quitar {kind === "video" ? "video" : "foto"}
        </button>
      )}
    </div>
  );
}
