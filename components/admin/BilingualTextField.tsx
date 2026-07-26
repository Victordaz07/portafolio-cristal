"use client";

import { inputClass } from "@/lib/admin-ui";

export default function BilingualTextField({
  label,
  es,
  en,
  onEsChange,
  onEnChange,
  multiline = false,
  rows = 2,
  required = false,
}: {
  label: string;
  es: string;
  en: string;
  onEsChange: (value: string) => void;
  onEnChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
}) {
  const Field = multiline ? "textarea" : "input";

  return (
    <div className="flex flex-col gap-sp-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <label className="flex flex-col gap-sp-1">
        <span className="text-xs uppercase tracking-wide text-moss">Español</span>
        <Field
          required={required}
          rows={multiline ? rows : undefined}
          value={es}
          onChange={(e) => onEsChange(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-sp-1">
        <span className="text-xs uppercase tracking-wide text-moss">English</span>
        <Field
          rows={multiline ? rows : undefined}
          value={en}
          onChange={(e) => onEnChange(e.target.value)}
          className={inputClass}
        />
      </label>
    </div>
  );
}
