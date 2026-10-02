"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ImageUploadField from "@/components/admin/ImageUploadField";
import BilingualTextField from "@/components/admin/BilingualTextField";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";
import { ACCENTS, accentVars, type AccentId } from "@/lib/theme";

interface Values {
  name: string;
  photoUrl: string;
  description: string;
  descriptionEn: string;
  accentColor: string;
}

export default function AppearanceForm({ initial, niche }: { initial: Values; niche: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/appearance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return showToast("error", data.error ?? "No se pudo guardar");
    showToast("success", "Apariencia guardada: ya se ve en el sitio");
    router.refresh(); // el layout vuelve a leer el color de acento
  }

  return (
    <form onSubmit={save} className="grid items-start gap-sp-4 xl:grid-cols-[1.2fr_1fr]">
      <Card className="flex flex-col gap-sp-5">
        <div className="grid gap-sp-4 sm:grid-cols-[160px_1fr]">
          <ImageUploadField label="Foto de perfil" value={values.photoUrl} onChange={(url) => set("photoUrl", url)} />
          <div className="flex flex-col gap-sp-4">
            <label className="flex flex-col gap-sp-1">
              <span className="text-sm font-medium text-ink">Nombre público</span>
              <input required value={values.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
            </label>
            <BilingualTextField
              label="Bio (la descripción de la portada)"
              es={values.description}
              en={values.descriptionEn}
              onEsChange={(v) => set("description", v)}
              onEnChange={(v) => set("descriptionEn", v)}
              multiline
              rows={3}
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Color de acento</p>
          <p className="text-xs text-ink/55">Botones, enlaces, etiquetas y detalles de todo el sitio y del panel.</p>
          <div className="mt-sp-3 grid grid-cols-3 gap-sp-3 sm:grid-cols-6">
            {(Object.keys(ACCENTS) as AccentId[]).map((id) => {
              const palette = ACCENTS[id];
              const selected = values.accentColor === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => set("accentColor", id)}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-1.5 rounded-[14px] border p-sp-2 transition ${
                    selected ? "border-ink ring-2 ring-ink/20" : "border-line hover:border-ink/40"
                  }`}
                >
                  <span className="flex">
                    <span className="h-7 w-7 rounded-full ring-2 ring-white" style={{ background: palette.accent }} />
                    <span className="-ml-2 h-7 w-7 rounded-full ring-2 ring-white" style={{ background: palette.dark }} />
                    <span className="-ml-2 h-7 w-7 rounded-full ring-2 ring-white" style={{ background: palette.light }} />
                  </span>
                  <span className="text-[11px] font-semibold text-ink">{palette.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? "Guardando…" : "Guardar apariencia"}
          </button>
        </div>
      </Card>

      {/* Vista previa con el color elegido, antes de guardar. */}
      <div style={accentVars(values.accentColor) as React.CSSProperties}>
        <Card className="flex flex-col items-center gap-sp-3 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Vista previa</p>
          {values.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.photoUrl} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-lime" />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-lime font-bodoni text-3xl font-bold italic text-ink">
              {values.name.charAt(0) || "C"}
            </span>
          )}
          <p className="font-fraunces text-2xl font-medium italic text-ink">{values.name || "Tu nombre"}</p>
          <span className="rounded-full bg-lime/50 px-sp-3 py-1 font-mono text-[10px] uppercase tracking-wide text-moss">{niche || "UGC Creator"}</span>
          <p className="max-w-sm text-sm text-ink/70">{values.description || "Tu bio aparece aquí."}</p>
          <div className="flex gap-sp-2">
            <span className="rounded-full bg-coral px-sp-4 py-sp-2 text-xs font-bold text-white">Colaboremos</span>
            <span className="rounded-full border border-coral px-sp-4 py-sp-2 text-xs font-bold text-coral">Ver portafolio</span>
          </div>
        </Card>
      </div>
    </form>
  );
}
