"use client";

import { useState } from "react";
import { useToast } from "./ToastContext";

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
  const noun = kind === "video" ? "el video" : "la foto";

  async function handleFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showToast("error", data.error ?? `No se pudo subir ${noun}`);
      setUploading(false);
      return;
    }

    onChange(data.url);
    setUploading(false);
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
      {uploading && <span className="text-xs text-moss">Subiendo...</span>}
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
