"use client";

import { useState } from "react";
import { useToast } from "./ToastContext";

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
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showToast("error", data.error ?? "No se pudo subir la imagen");
      setUploading(false);
      return;
    }

    onChange(data.url);
    setUploading(false);
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
