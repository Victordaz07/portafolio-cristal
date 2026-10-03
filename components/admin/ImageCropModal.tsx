"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImageBlob, type CroppedAreaPixels } from "@/lib/image-crop";
import { useToast } from "./ToastContext";

export interface AspectOption {
  label: string;
  value: number;
}

/**
 * Ventana para arrastrar, acercar y encuadrar una foto antes de subirla (o para
 * volver a ajustar una ya subida). Si `aspectOptions` trae más de una opción, la
 * persona puede cambiar la forma del recorte (p. ej. logos: cuadrado/horizontal/vertical).
 */
export default function ImageCropModal({
  imageSrc,
  aspectOptions,
  mimeType,
  onCancel,
  onConfirm,
}: {
  imageSrc: string;
  aspectOptions: AspectOption[];
  mimeType: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const { showToast } = useToast();
  const [aspect, setAspect] = useState(aspectOptions[0].value);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function confirm() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, mimeType);
      onConfirm(blob);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "No se pudo recortar la imagen");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/80 p-sp-4 sm:items-center sm:justify-center">
      <div className="flex w-full max-w-lg flex-col gap-sp-4 rounded-[20px] bg-white p-sp-5 shadow-2xl">
        <div>
          <p className="font-fraunces italic text-lg text-ink">Ajusta tu foto</p>
          <p className="text-xs text-ink/55">Arrastra para moverla y usa la barra para acercar o alejar.</p>
        </div>

        <div className="relative h-[55vh] max-h-[420px] w-full overflow-hidden rounded-[14px] bg-ink/5">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {aspectOptions.length > 1 && (
          <div className="flex gap-sp-2">
            {aspectOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setAspect(option.value)}
                className={`rounded-full border px-sp-3 py-1.5 text-xs font-semibold transition ${
                  aspect === option.value ? "border-ink bg-ink text-cream" : "border-line text-ink/70 hover:border-ink/40"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <label className="flex items-center gap-sp-3">
          <span className="text-xs font-medium text-ink/70">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-full accent-coral"
          />
        </label>

        <div className="flex justify-end gap-sp-3">
          <button type="button" onClick={onCancel} className="rounded-full px-sp-4 py-sp-2 text-sm font-semibold text-ink/60 hover:text-ink">
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={saving || !croppedAreaPixels}
            className="rounded-full bg-coral px-sp-5 py-sp-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Usar esta foto"}
          </button>
        </div>
      </div>
    </div>
  );
}
