"use client";

import { useMemo, useState } from "react";
import type { BioLink } from "@prisma/client";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import BilingualTextField from "@/components/admin/BilingualTextField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { useToast } from "@/components/admin/ToastContext";
import { swapOrder } from "@/lib/reorder";
import { POPULAR_MIN_CLICKS, type LinkPatternId } from "@/lib/bio-links";
import { cardClass, dangerLinkClass, inputClass, primaryButtonClass, rowCardStartClass, secondaryButtonClass } from "@/lib/admin-ui";

const API_BASE = "/api/admin/links";
const EMPTY = {
  title: "",
  titleEn: "",
  url: "https://",
  imageUrl: "",
  pill: "",
  wide: true,
  section: "",
  sectionEn: "",
  kicker: "",
  kickerEn: "",
  badge: "",
  badgeEn: "",
};
type Form = typeof EMPTY;

export interface LinksPageSettings {
  linksTagline: string;
  linksTaglineEn: string;
  linksPattern: LinkPatternId;
  linksShowBrandKit: boolean;
  linksShowRecent: boolean;
}

const eyebrow = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

export default function LinksManager({
  initialLinks,
  initialSettings,
  pageUrl,
  previewPath,
}: {
  initialLinks: BioLink[];
  initialSettings: LinksPageSettings;
  pageUrl: string;
  previewPath: string;
}) {
  const { showToast } = useToast();
  const [links, setLinks] = useState(initialLinks);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BioLink | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [page, setPage] = useState(initialSettings);
  const [savingPage, setSavingPage] = useState(false);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const refresh = () => setFrameKey((k) => k + 1);

  const sections = useMemo(() => Array.from(new Set(links.map((l) => l.section).filter(Boolean))), [links]);
  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const top = links.reduce<BioLink | null>((best, l) => (l.clicks >= POPULAR_MIN_CLICKS && (!best || l.clicks > best.clicks) ? l : best), null);

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
    // Se queda la sección elegida para cargar varios enlaces seguidos en el mismo grupo.
    setForm({ ...EMPTY, section: form.section, sectionEn: form.sectionEn });
    setEditing(null);
    refresh();
    showToast("success", editing ? "Enlace actualizado" : "Enlace agregado");
  }

  function edit(link: BioLink) {
    setEditing(link.id);
    setForm({
      title: link.title,
      titleEn: link.titleEn ?? "",
      url: link.url,
      imageUrl: link.imageUrl ?? "",
      pill: link.pill ?? "",
      wide: link.wide,
      section: link.section,
      sectionEn: link.sectionEn ?? "",
      kicker: link.kicker ?? "",
      kickerEn: link.kickerEn ?? "",
      badge: link.badge ?? "",
      badgeEn: link.badgeEn ?? "",
    });
    document.getElementById("link-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function remove(link: BioLink) {
    const response = await fetch(`${API_BASE}/${link.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) return showToast("error", "No se pudo eliminar");
    setLinks((current) => current.filter((l) => l.id !== link.id));
    refresh();
    showToast("success", "Enlace eliminado");
  }

  async function savePage(next: LinksPageSettings) {
    setPage(next);
    setSavingPage(true);
    const response = await fetch(`${API_BASE}/settings`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
    setSavingPage(false);
    if (!response.ok) return showToast("error", "No se pudieron guardar las opciones");
    refresh();
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
            <p className={eyebrow}>Tu link en bio</p>
            <p className="mt-1 truncate font-mono text-sm text-ink">{pageUrl.replace(/^https?:\/\//, "")}</p>
            <p className="mt-1 text-xs text-ink/55">
              {totalClicks} {totalClicks === 1 ? "clic" : "clics"} en tus enlaces
              {top ? ` · el más visitado: "${top.title}" (lleva la etiqueta "Más clics")` : ""}
            </p>
          </div>
          <button type="button" onClick={copy} className={primaryButtonClass}>
            Copiar enlace
          </button>
          <a href={pageUrl} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
            Abrir ↗
          </a>
        </Card>

        <Card className="flex flex-col gap-sp-4">
          <p className={eyebrow}>La página</p>
          <BilingualTextField
            label="Frase bajo tu nombre"
            es={page.linksTagline}
            en={page.linksTaglineEn}
            onEsChange={(v) => setPage((p) => ({ ...p, linksTagline: v }))}
            onEnChange={(v) => setPage((p) => ({ ...p, linksTaglineEn: v }))}
          />
          <div className="flex flex-wrap items-center gap-sp-2">
            <button type="button" disabled={savingPage} onClick={() => savePage(page)} className={secondaryButtonClass}>
              {savingPage ? "Guardando…" : "Guardar frase"}
            </button>
            <span className="text-xs text-ink/50">Vacía usa &quot;Mis favoritos y más ✨&quot;.</span>
          </div>
          <p className="text-xs text-ink/55">
            El color, la tipografía y el fondo decorativo se eligen en{" "}
            <a href="/admin/apariencia" className="font-semibold text-coral hover:underline">
              Estudio de diseño
            </a>
            .
          </p>
          <div className="flex flex-col gap-sp-2">
            <p className="text-sm font-medium text-ink">Bloques automáticos</p>
            <label className="flex items-center gap-sp-2 text-sm text-ink/80">
              <input type="checkbox" checked={page.linksShowBrandKit} onChange={(e) => savePage({ ...page, linksShowBrandKit: e.target.checked })} />
              &quot;Trabaja conmigo&quot;: media kit, contacto, WhatsApp y correo
            </label>
            <label className="flex items-center gap-sp-2 text-sm text-ink/80">
              <input type="checkbox" checked={page.linksShowRecent} onChange={(e) => savePage({ ...page, linksShowRecent: e.target.checked })} />
              &quot;Contenido reciente&quot;: tus 4 publicaciones destacadas del Feed
            </label>
          </div>
        </Card>

        <div>
          <p className="mb-sp-2 text-sm font-semibold text-ink">Tus enlaces ({links.length})</p>
          {links.length === 0 && <p className="text-sm text-ink/55">Todavía no agregas enlaces: tus marcas, tu tienda de Amazon, cupones, tu PayPal…</p>}
          <ul className="flex flex-col gap-sp-3">
            {links.map((link, index) => (
              <li key={link.id} className={rowCardStartClass}>
                <ReorderButtons
                  onUp={async () => {
                    setLinks(await swapOrder(links, index, "up", API_BASE));
                    refresh();
                  }}
                  onDown={async () => {
                    setLinks(await swapOrder(links, index, "down", API_BASE));
                    refresh();
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
                    {link.badge && <span className="ml-sp-2 rounded-full bg-moss px-sp-2 py-0.5 text-[10px] font-bold text-white">{link.badge}</span>}
                    {link.pill && <span className="ml-sp-2 rounded-full bg-lime/30 px-sp-2 py-0.5 font-mono text-[10px] uppercase text-moss">{link.pill}</span>}
                  </p>
                  <p className="truncate text-xs text-ink/55">
                    {link.section || "Sin grupo"} · {link.wide ? "Fila" : "Tarjeta"} · {link.clicks} {link.clicks === 1 ? "clic" : "clics"} · {link.url}
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

        <form id="link-form" onSubmit={submit} className={`${cardClass} flex max-w-2xl flex-col gap-sp-4`}>
          <p className="font-semibold text-ink">{editing ? "Editar enlace" : "Agregar enlace"}</p>
          <BilingualTextField label="Título" es={form.title} en={form.titleEn} onEsChange={(v) => set("title", v)} onEnChange={(v) => set("titleEn", v)} required />
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Enlace</span>
            <input required type="url" value={form.url} onChange={(e) => set("url", e.target.value)} className={inputClass} placeholder="https://" />
          </label>
          <p className="-mt-sp-3 text-xs text-ink/50">PayPal, tiendas, redes y correo llevan su ícono solo si no subes imagen.</p>
          <div className="grid gap-sp-4 sm:grid-cols-2">
            <label className="flex flex-col gap-sp-1">
              <span className="text-sm font-medium text-ink">Grupo</span>
              <input list="link-sections" value={form.section} maxLength={40} onChange={(e) => set("section", e.target.value)} className={inputClass} placeholder="Colabora conmigo, Mis favoritos…" />
              <datalist id="link-sections">
                {sections.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
            <label className="flex flex-col gap-sp-1">
              <span className="text-sm font-medium text-ink">Grupo en inglés</span>
              <input value={form.sectionEn} maxLength={40} onChange={(e) => set("sectionEn", e.target.value)} className={inputClass} placeholder="Collab with me, My faves…" />
            </label>
          </div>
          <div className="grid gap-sp-4 sm:grid-cols-[160px_1fr]">
            <ImageUploadField label="Imagen o logo (opcional)" value={form.imageUrl} onChange={(url) => set("imageUrl", url)} />
            <fieldset className="flex flex-col gap-sp-2">
              <legend className="text-sm font-medium text-ink">Cómo se ve</legend>
              <label className="flex items-center gap-sp-2 text-sm text-ink/80">
                <input type="radio" checked={form.wide} onChange={() => set("wide", true)} /> Fila a todo el ancho
              </label>
              <label className="flex items-center gap-sp-2 text-sm text-ink/80">
                <input type="radio" checked={!form.wide} onChange={() => set("wide", false)} /> Tarjeta (dos por fila)
              </label>
            </fieldset>
          </div>
          <div className="grid gap-sp-4 sm:grid-cols-2">
            <BilingualTextField label="Palabra de acción (tarjeta)" es={form.kicker} en={form.kickerEn} onEsChange={(v) => set("kicker", v)} onEnChange={(v) => set("kickerEn", v)} />
            <BilingualTextField label="Etiqueta destacada" es={form.badge} en={form.badgeEn} onEsChange={(v) => set("badge", v)} onEnChange={(v) => set("badgeEn", v)} />
          </div>
          <p className="-mt-sp-2 text-xs text-ink/50">
            Acción: &quot;Comprar&quot;, &quot;Únete&quot;, &quot;Reclamar&quot;. Destacada (en tu color): &quot;Abierto ahora&quot;. Si la dejas vacía, el enlace más visitado
            lleva &quot;Más clics&quot; solo.
          </p>
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Descuento o etiqueta corta (opcional)</span>
            <input value={form.pill} maxLength={14} onChange={(e) => set("pill", e.target.value)} className={inputClass} placeholder="15% OFF, Nuevo, Gratis…" />
          </label>
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
          <p className={`${eyebrow} self-start`}>Vista previa</p>
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
