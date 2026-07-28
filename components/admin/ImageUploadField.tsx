"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { useToast } from "./ToastContext";

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

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const blob = await upload(sanitizePathname(file.name), file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        clientPayload: JSON.stringify({ kind: "photo" }),
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
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-24 w-24 rounded-sm object-cover" />
      )}
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="text-sm text-ink/70"
      />
      {uploading && <span className="text-xs text-moss">Subiendo...</span>}
    </div>
  );
}
