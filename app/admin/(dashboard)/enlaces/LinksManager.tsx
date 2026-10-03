"use client";

import { useState } from "react";
import type { BioLink } from "@prisma/client";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import BilingualTextField from "@/components/admin/BilingualTextField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { useToast } from "@/components/admin/ToastContext";
import { swapOrder } from "@/lib/reorder";
import { cardClass, dangerLinkClass, inputClass, primaryButtonClass, rowCardStartClass, secondaryButtonClass } from "@/lib/admin-ui";

const API_BASE = "/api/admin/links";
const EMPTY = { title: "", titleEn: "", url: "https://", imageUrl: "", pill: "", wide: true };

export default function LinksManager({ initialLinks, pageUrl, previewPath }: { initialLinks: BioLink[]; pageUrl: string; previewPath: string }) {
  const { showToast } = useToast();
  const [links, setLinks] = useState(initialLinks);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BioLink | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(editing ? `${API_BASE}/${editing}` : API_BASE, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return showToast("error", data.error ?? "No se pudo guardar el enlace");
    setLinks((current) => (editing ? current.map((l) => (l.id === editing ? data : l)) : [...current, data]));
    setForm(EMPTY);
    setEditing(null);
    setFrameKey((k) => k + 1);
    showToast("success", editing ? "Enlace actualizado" : "Enlace agregado");
  }

  function edit(link: BioLink) {
    setEditing(link.id);
    setForm({ title: link.title, titleEn: link.titleEn ?? "", url: link.url, imageUrl: link.imageUrl ?? "", pill: link.pill ?? "", wide: link.wide });
  }

  async function remove(link: BioLink) {
    const response = await fetch(`${API_BASE}/${link.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) return showToast("error", "No se pudo eliminar");
    setLinks((current) => current.filter((l) => l.id !== link.id));
    setFrameKey((k) => k + 1);
    showToast("success", "Enlace eliminado");
  }

  async function copy() {
    await navigator.clipboard.writeText(pageUrl).catch(() => null);
    showToast("success", "Enlace copiado: pégalo en tu bio");
  }

  return (
    <div className="grid items-start gap-sp-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col gap-sp-4">
        <Card className="flex flex-wrap items-center gap-sp-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Tu link en bio</p>
            <p className="mt-1 truncate font-mono text-sm text-ink">{pageUrl.replace(/^https?:\/\//, "")}</p>
          </div>
          <button type="button" onClick={copy} className={primaryButtonClass}>
            Copiar enlace
          </button>
          <a href={pageUrl} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
            Abrir ↗
          </a>
        </Card>

        <Card>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Lo que sale solo</p>
          <p className="mt-1 text-sm text-ink/70">
            Tu foto, nombre, nicho, bio y redes; la tarjeta grande hacia tu portafolio; media kit, contacto, WhatsApp y correo (si los tienes en
            Contacto y pie) y tus 4 publicaciones destacadas o más recientes del Feed. Colores, tipografía y bordes vienen del Estudio de diseño.
          </p>
        </Card>

        <div>
          <p className="mb-sp-2 text-sm font-semibold text-ink">Tus enlaces ({links.length})</p>
          {links.length === 0 && <p className="text-sm text-ink/55">Todavía no agregas enlaces propios: tu tienda, un cupón, tu último video…</p>}
          <ul className="flex flex-col gap-sp-3">
            {links.map((link, index) => (
              <li key={link.id} className={rowCardStartClass}>
                <ReorderButtons
                  onUp={async () => {
                    setLinks(await swapOrder(links, index, "up", API_BASE));
                    setFrameKey((k) => k + 1);
                  }}
                  onDown={async () => {
                    setLinks(await swapOrder(links, index, "down", API_BASE));
                    setFrameKey((k) => k + 1);
                  }}
                  disableUp={index === 0}
                  disableDown={index === links.length - 1}
                />
                {link.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-[10px] object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">
                    {link.title}
                    {link.pill && <span className="ml-sp-2 rounded-full bg-lime/30 px-sp-2 py-0.5 font-mono text-[10px] uppercase text-moss">{link.pill}</span>}
                  </p>
                  <p className="truncate text-xs text-ink/55">
                    {link.wide ? "Fila" : "Tarjeta con imagen"} · {link.url}
                  </p>
                </div>
                <button type="button" onClick={() => edit(link)} className="text-sm font-medium text-coral hover:underline">
                  Editar
                </button>
                <button type="button" onClick={() => setPendingDelete(link)} className={dangerLinkClass}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={submit} className={`${cardClass} flex max-w-2xl flex-col gap-sp-4`}>
          <p className="font-semibold text-ink">{editing ? "Editar enlace" : "Agregar enlace"}</p>
          <BilingualTextField label="Título" es={form.title} en={form.titleEn} onEsChange={(v) => set("title", v)} onEnChange={(v) => set("titleEn", v)} required />
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Enlace</span>
            <input required type="url" value={form.url} onChange={(e) => set("url", e.target.value)} className={inputClass} placeholder="https://" />
          </label>
          <div className="grid gap-sp-4 sm:grid-cols-[160px_1fr]">
            <ImageUploadField label="Imagen (opcional)" value={form.imageUrl} onChange={(url) => set("imageUrl", url)} />
            <div className="flex flex-col gap-sp-4">
              <label className="flex flex-col gap-sp-1">
                <span className="text-sm font-medium text-ink">Etiqueta (opcional)</span>
                <input value={form.pill} maxLength={14} onChange={(e) => set("pill", e.target.value)} className={inputClass} placeholder="Nuevo, -20%, Gratis…" />
              </label>
              <fieldset className="flex flex-col gap-sp-2">
                <legend className="text-sm font-medium text-ink">Cómo se ve</legend>
                <label className="flex items-center gap-sp-2 text-sm text-ink/80">
                  <input type="radio" checked={form.wide} onChange={() => set("wide", true)} /> Fila a todo el ancho
                </label>
                <label className="flex items-center gap-sp-2 text-sm text-ink/80">
                  <input type="radio" checked={!form.wide} onChange={() => set("wide", false)} /> Tarjeta con imagen (dos por fila)
                </label>
              </fieldset>
            </div>
          </div>
          <div className="flex gap-sp-3">
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "+ agregar enlace"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(EMPTY);
                }}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="xl:sticky xl:top-sp-4">
        <Card className="flex flex-col items-center gap-sp-3">
          <p className="self-start font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Vista previa</p>
          <div className="h-[700px] w-[340px] overflow-hidden rounded-[32px] border-4 border-ink">
            <iframe key={frameKey} title="Vista previa del link en bio" src={previewPath} className="h-full w-full border-0 bg-white" />
          </div>
        </Card>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar enlace"
          description={`¿Eliminar "${pendingDelete.title}"?`}
          onConfirm={() => remove(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
