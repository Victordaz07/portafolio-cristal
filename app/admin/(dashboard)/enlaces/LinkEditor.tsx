"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BioLink, BioLinkGroup } from "@prisma/client";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import BilingualTextField from "@/components/admin/BilingualTextField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { LINK_IMAGE_ASPECT_OPTIONS } from "@/lib/image-crop";
import { useToast } from "@/components/admin/ToastContext";
import { POPULAR_MIN_CLICKS } from "@/lib/bio-links";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";
import { usePreviewLocale } from "@/components/admin/usePreviewLocale";

// Editor visual del link en bio: a la izquierda los bloques en el orden en que se ven, a la derecha la página real.
// Tocar algo en la vista previa abre su edición aquí; cada cambio se guarda solo y la vista previa se actualiza.

type Group = BioLinkGroup & { links: BioLink[] };

export interface PageSettings {
  linksTagline: string;
  linksTaglineEn: string;
  linksShowCopy: boolean;
  linksShowSocials: boolean;
  linksHeroShow: boolean;
  linksHeroEyebrow: string;
  linksHeroEyebrowEn: string;
  linksHeroTitle: string;
  linksHeroTitleEn: string;
  linksHeroImage: string;
  linksHeroUrl: string;
}

type Status = "idle" | "saving" | "saved" | "error";
type Drag = { type: "link"; id: string } | { type: "group"; id: string } | null;

const eyebrow = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";
const AUTO_INFO_EN: Record<string, { name: string; info: string }> = {
  brandkit: { name: "Work with me", info: "Automatic: media kit, contact form, WhatsApp and email (taken from Contact & footer)." },
  recent: { name: "Recent content", info: "Automatic: your 4 featured or most recent Feed posts." },
};
const AUTO_INFO: Record<string, { name: string; info: string }> = {
  brandkit: { name: "Trabaja conmigo", info: "Automático: media kit, formulario de contacto, WhatsApp y correo (salen de Contacto y pie)." },
  recent: { name: "Contenido reciente", info: "Automático: tus 4 publicaciones destacadas o más recientes del Feed." },
};

export default function LinkEditor({
  initialGroups,
  initialPage,
  pageUrl,
  previewPath,
  heroPhoto,
}: {
  initialGroups: Group[];
  initialPage: PageSettings;
  pageUrl: string;
  previewPath: string;
  heroPhoto: string | null;
}) {
  const { showToast } = useToast();
  const { t, lang } = useT();
  const previewReady = usePreviewLocale();
  const [groups, setGroups] = useState(initialGroups);
  const [page, setPage] = useState(initialPage);
  const [open, setOpen] = useState<string | null>(null); // "header" | "hero" | "group:id" | "link:id" | "new:groupId"
  const [status, setStatus] = useState<Status>("idle");
  const [frameKey, setFrameKey] = useState(0);
  const [drag, setDrag] = useState<Drag>(null);
  const [confirm, setConfirm] = useState<{ title: string; description: string; run: () => void } | null>(null);
  const [newGroup, setNewGroup] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>();

  const refreshPreview = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => setFrameKey((k) => k + 1), 350);
  }, []);

  /** Llama a la API, muestra el estado y actualiza la vista previa. */
  const api = useCallback(
    async (method: string, url: string, body?: unknown) => {
      setStatus("saving");
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }).catch(() => null);
      const data = await response?.json().catch(() => ({}));
      if (!response?.ok) {
        setStatus("error");
        showToast("error", data?.error ?? t("No se pudo guardar", "Couldn't save"));
        return null;
      }
      setStatus("saved");
      refreshPreview();
      return data;
    },
    [refreshPreview, showToast, t]
  );

  // ─── Vista previa ↔ editor ───
  const focusPreview = (target: string) => frame.current?.contentWindow?.postMessage({ type: "fc-link-focus", target }, window.location.origin);
  const openTarget = useCallback((target: string | null) => {
    setOpen(target);
    if (!target) return;
    requestAnimationFrame(() => document.getElementById(`edit-${target}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, []);
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== "fc-link-edit") return;
      openTarget(String(event.data.target));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [openTarget]);
  const toggle = (target: string) => {
    const next = open === target ? null : target;
    setOpen(next);
    if (next) focusPreview(next.startsWith("new:") ? `group:${next.slice(4)}` : next);
  };

  // ─── Orden (mover, arrastrar, cambiar de grupo) ───
  async function saveLayout(next: Group[]) {
    setGroups(next);
    await api("PUT", "/api/admin/links/layout", { groups: next.map((g) => ({ id: g.id, links: g.links.map((l) => l.id) })) });
  }
  function moveGroup(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= groups.length) return;
    const next = [...groups];
    const [g] = next.splice(index, 1);
    next.splice(target, 0, g);
    saveLayout(next);
  }
  function moveLink(linkId: string, toGroupId: string, toIndex?: number) {
    const link = groups.flatMap((g) => g.links).find((l) => l.id === linkId);
    if (!link) return;
    const next = groups.map((g) => ({ ...g, links: g.links.filter((l) => l.id !== linkId) }));
    const dest = next.find((g) => g.id === toGroupId);
    if (!dest || dest.kind !== "custom") return;
    dest.links.splice(toIndex ?? dest.links.length, 0, { ...link, groupId: toGroupId });
    saveLayout(next);
  }
  function stepLink(group: Group, index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= group.links.length) return;
    moveLink(group.links[index].id, group.id, target);
  }
  function dropOnGroup(groupIndex: number) {
    if (drag?.type === "group") {
      const from = groups.findIndex((g) => g.id === drag.id);
      if (from >= 0 && from !== groupIndex) moveGroup(from, groupIndex - from);
    } else if (drag?.type === "link") {
      moveLink(drag.id, groups[groupIndex].id);
    }
    setDrag(null);
  }
  function dropOnLink(group: Group, index: number) {
    if (drag?.type === "link") moveLink(drag.id, group.id, index);
    setDrag(null);
  }

  // ─── Grupos ───
  async function patchGroup(group: Group, data: Partial<Pick<Group, "title" | "titleEn" | "hidden">>) {
    setGroups((gs) => gs.map((g) => (g.id === group.id ? { ...g, ...data } : g)));
    await api("PATCH", `/api/admin/links/groups/${group.id}`, data);
  }
  async function addGroup(event: React.FormEvent) {
    event.preventDefault();
    if (!newGroup.trim()) return;
    const created = await api("POST", "/api/admin/links/groups", { title: newGroup.trim() });
    if (!created) return;
    setGroups((gs) => [...gs, created]);
    setNewGroup("");
    openTarget(`group:${created.id}`);
  }
  function deleteGroup(group: Group) {
    setConfirm({
      title: t("Eliminar grupo", "Delete group"),
      description: t(
        `¿Eliminar "${group.title}"${group.links.length ? ` y sus ${group.links.length} enlaces` : ""}?`,
        `Delete "${group.title}"${group.links.length ? ` and its ${group.links.length} links` : ""}?`
      ),
      run: async () => {
        if (await api("DELETE", `/api/admin/links/groups/${group.id}`)) setGroups((gs) => gs.filter((g) => g.id !== group.id));
      },
    });
  }

  // ─── Enlaces ───
  async function patchLink(link: BioLink, data: Partial<BioLink>) {
    setGroups((gs) => gs.map((g) => ({ ...g, links: g.links.map((l) => (l.id === link.id ? { ...l, ...data } : l)) })));
    await api("PATCH", `/api/admin/links/${link.id}`, data);
  }
  function deleteLink(link: BioLink) {
    setConfirm({
      title: t("Eliminar enlace", "Delete link"),
      description: t(
        `¿Eliminar "${link.title}"? Si solo quieres quitarlo un tiempo, usa el ojo para ocultarlo.`,
        `Delete "${link.title}"? If you only want to remove it for a while, use the eye to hide it.`
      ),
      run: async () => {
        if (await api("DELETE", `/api/admin/links/${link.id}`)) setGroups((gs) => gs.map((g) => ({ ...g, links: g.links.filter((l) => l.id !== link.id) })));
      },
    });
  }
  function onLinkSaved(saved: BioLink, isNew: boolean) {
    setGroups((gs) =>
      gs.map((g) =>
        g.id !== saved.groupId ? g : { ...g, links: isNew ? [...g.links, saved] : g.links.map((l) => (l.id === saved.id ? saved : l)) }
      )
    );
    setStatus("saved");
    refreshPreview();
    setOpen(`group:${saved.groupId}`);
  }

  // ─── Página (encabezado y tarjeta principal) ───
  async function savePage(data: Partial<PageSettings>) {
    setPage((p) => ({ ...p, ...data }));
    await api("PATCH", "/api/admin/links/settings", data);
  }

  const allLinks = groups.flatMap((g) => g.links);
  const totalClicks = allLinks.reduce((s, l) => s + l.clicks, 0);
  const top = allLinks.reduce<BioLink | null>((best, l) => (l.clicks >= POPULAR_MIN_CLICKS && (!best || l.clicks > best.clicks) ? l : best), null);
  const customGroups = groups.filter((g) => g.kind === "custom");

  return (
    <div className="grid items-start gap-sp-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex min-w-0 flex-col gap-sp-3">
        <Card className="flex flex-wrap items-center gap-sp-3">
          <div className="min-w-0 flex-1">
            <p className={eyebrow}>{t("Tu link en bio", "Your link in bio")}</p>
            <p className="mt-1 truncate font-mono text-sm text-ink">{pageUrl.replace(/^https?:\/\//, "")}</p>
            <p className="mt-1 text-xs text-ink/55">
              {t(
                `${totalClicks} ${totalClicks === 1 ? "clic" : "clics"} en tus enlaces${top ? ` · el más visitado: "${top.title}"` : ""}`,
                `${totalClicks} ${totalClicks === 1 ? "click" : "clicks"} on your links${top ? ` · most visited: "${top.title}"` : ""}`
              )}
            </p>
          </div>
          <SaveStatus status={status} />
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(pageUrl).catch(() => null);
              showToast("success", t("Enlace copiado: pégalo en tu bio", "Link copied: paste it in your bio"));
            }}
            className={primaryButtonClass}
          >
            {t("Copiar enlace", "Copy link")}
          </button>
          <a href={pageUrl} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
            {t("Abrir ↗", "Open ↗")}
          </a>
        </Card>
        <p className="px-sp-1 text-xs text-ink/55">
          {t(
            "Toca cualquier parte de la vista previa para editarla. Arrastra (⋮⋮) o usa las flechas para cambiar el orden; el ojo oculta sin borrar. Colores, tipografía y fondo:",
            "Tap any part of the preview to edit it. Drag (⋮⋮) or use the arrows to reorder; the eye hides without deleting. Colors, typography and background:"
          )}{" "}
          <a href="/admin/apariencia" className="font-semibold text-coral hover:underline">
            {t("Estudio de diseño", "Design studio")}
          </a>
          .
        </p>

        {/* Encabezado (siempre arriba) */}
        <Block
          id="header"
          title={t("Encabezado", "Header")}
          subtitle={t(
            `Foto, nombre, frase${page.linksShowCopy ? ", copiar enlace" : ""}${page.linksShowSocials ? ", redes" : ""}`,
            `Photo, name, tagline${page.linksShowCopy ? ", copy link" : ""}${page.linksShowSocials ? ", socials" : ""}`
          )}
          open={open === "header"}
          onToggle={() => toggle("header")}
          fixed
        >
          <BilingualTextField
            label={t("Frase bajo tu nombre", "Tagline under your name")}
            es={page.linksTagline}
            en={page.linksTaglineEn}
            onEsChange={(v) => setPage((p) => ({ ...p, linksTagline: v }))}
            onEnChange={(v) => setPage((p) => ({ ...p, linksTaglineEn: v }))}
          />
          <div className="flex flex-wrap items-center gap-sp-3">
            <button type="button" onClick={() => savePage({ linksTagline: page.linksTagline, linksTaglineEn: page.linksTaglineEn })} className={secondaryButtonClass}>
              {t("Guardar frase", "Save tagline")}
            </button>
            <span className="text-xs text-ink/50">{t("Vacía: “Mis favoritos y más ✨”.", "Empty: “My favorites and more ✨”.")}</span>
          </div>
          <Switch label={t("Botón “Copiar mi enlace”", "“Copy my link” button")} checked={page.linksShowCopy} onChange={(v) => savePage({ linksShowCopy: v })} />
          <Switch label={t("Íconos de tus redes", "Social media icons")} checked={page.linksShowSocials} onChange={(v) => savePage({ linksShowSocials: v })} />
          <p className="text-xs text-ink/55">
            {t("La foto y el nombre se cambian en", "Change the photo and name in")}{" "}
            <a href="/admin/apariencia" className="font-semibold text-coral hover:underline">
              {t("Estudio de diseño", "Design studio")}
            </a>
            {t("; tus redes y correo, en", "; your socials and email in")}{" "}
            <a href="/admin/contacto" className="font-semibold text-coral hover:underline">
              {t("Contacto y pie", "Contact & footer")}
            </a>
            .
          </p>
        </Block>

        {/* Tarjeta principal */}
        <Block
          id="hero"
          title={t("Tarjeta principal", "Main card")}
          subtitle={(lang === "en" && page.linksHeroTitleEn) || page.linksHeroTitle || t("Mi portafolio completo", "My full portfolio")}
          open={open === "hero"}
          onToggle={() => toggle("hero")}
          hidden={!page.linksHeroShow}
          onHide={() => savePage({ linksHeroShow: !page.linksHeroShow })}
          fixed
        >
          <div className="grid gap-sp-4 sm:grid-cols-2">
            <BilingualTextField
              label={t("Etiqueta pequeña", "Small label")}
              es={page.linksHeroEyebrow}
              en={page.linksHeroEyebrowEn}
              onEsChange={(v) => setPage((p) => ({ ...p, linksHeroEyebrow: v }))}
              onEnChange={(v) => setPage((p) => ({ ...p, linksHeroEyebrowEn: v }))}
            />
            <BilingualTextField
              label={t("Título", "Title")}
              es={page.linksHeroTitle}
              en={page.linksHeroTitleEn}
              onEsChange={(v) => setPage((p) => ({ ...p, linksHeroTitle: v }))}
              onEnChange={(v) => setPage((p) => ({ ...p, linksHeroTitleEn: v }))}
            />
          </div>
          <div className="grid gap-sp-4 sm:grid-cols-[180px_1fr]">
            <ImageUploadField
              label={t("Imagen de fondo", "Background image")}
              value={page.linksHeroImage}
              onChange={(url) => savePage({ linksHeroImage: url })}
              aspect={5 / 2}
              recommendedSize="1500 × 600 px"
            />
            <div className="flex flex-col gap-sp-2">
              <label className="flex flex-col gap-sp-1">
                <span className="text-sm font-medium text-ink">{t("Lleva a", "Links to")}</span>
                <input
                  value={page.linksHeroUrl}
                  onChange={(e) => setPage((p) => ({ ...p, linksHeroUrl: e.target.value }))}
                  className={inputClass}
                  placeholder={t("Vacío: tu portafolio", "Empty: your portfolio")}
                />
              </label>
              <p className="text-xs text-ink/50">
                {t(
                  `Sin imagen se usa ${heroPhoto ? "tu foto de portada" : "el color de tu sitio"}. Vacío: “PORTAFOLIO · Mi portafolio completo”.`,
                  `With no image, ${heroPhoto ? "your cover photo" : "your site color"} is used. Empty: “PORTFOLIO · My full portfolio”.`
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              savePage({
                linksHeroEyebrow: page.linksHeroEyebrow,
                linksHeroEyebrowEn: page.linksHeroEyebrowEn,
                linksHeroTitle: page.linksHeroTitle,
                linksHeroTitleEn: page.linksHeroTitleEn,
                linksHeroUrl: page.linksHeroUrl,
              })
            }
            className={`${primaryButtonClass} self-start`}
          >
            {t("Guardar tarjeta", "Save card")}
          </button>
        </Block>

        {/* Bloques que se ordenan */}
        {groups.map((group, gi) => {
          const auto = (lang === "en" ? AUTO_INFO_EN : AUTO_INFO)[group.kind];
          const groupTitle = (lang === "en" && group.titleEn) || group.title;
          const target = `group:${group.id}`;
          const isOpen = open === target || open === `new:${group.id}` || group.links.some((l) => open === `link:${l.id}`);
          return (
            <Block
              key={group.id}
              id={target}
              title={auto ? groupTitle || auto.name : groupTitle || t("Sin título", "Untitled")}
              subtitle={
                auto
                  ? t("Automático", "Automatic")
                  : t(
                      `${group.links.length} ${group.links.length === 1 ? "enlace" : "enlaces"}`,
                      `${group.links.length} ${group.links.length === 1 ? "link" : "links"}`
                    )
              }
              open={isOpen}
              onToggle={() => toggle(target)}
              hidden={group.hidden}
              onHide={() => patchGroup(group, { hidden: !group.hidden })}
              onUp={gi > 0 ? () => moveGroup(gi, -1) : undefined}
              onDown={gi < groups.length - 1 ? () => moveGroup(gi, 1) : undefined}
              draggable
              onDragStart={() => setDrag({ type: "group", id: group.id })}
              onDrop={() => dropOnGroup(gi)}
              dropActive={Boolean(drag) && !(drag?.type === "link" && group.kind !== "custom")}
            >
              {auto && <p className="text-sm text-ink/65">{auto.info}</p>}
              <GroupTitleEditor group={group} placeholder={auto?.name} onSave={(data) => patchGroup(group, data)} />

              {group.kind === "custom" && (
                <>
                  <ul className="flex flex-col gap-sp-2">
                    {group.links.map((link, li) => (
                      <li
                        key={link.id}
                        id={`edit-link:${link.id}`}
                        onDragOver={(e) => drag?.type === "link" && e.preventDefault()}
                        onDrop={(e) => {
                          e.stopPropagation();
                          dropOnLink(group, li);
                        }}
                        className={`rounded-[14px] border transition ${open === `link:${link.id}` ? "border-coral bg-white" : "border-line bg-white"} ${
                          link.hidden ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-center gap-sp-2 p-sp-2">
                          <span
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              setDrag({ type: "link", id: link.id });
                            }}
                            onDragEnd={() => setDrag(null)}
                            title={t("Arrastra para mover", "Drag to move")}
                            className="cursor-grab select-none px-1 text-ink/35 active:cursor-grabbing"
                          >
                            ⋮⋮
                          </span>
                          {link.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={link.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-[8px] object-cover" />
                          ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-lime/25 text-xs text-moss">✦</span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggle(`link:${link.id}`)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span className="block truncate text-sm font-semibold text-ink">
                              {(lang === "en" && link.titleEn) || link.title}
                              {link.hidden && <span className="ml-sp-2 text-[10px] font-normal uppercase text-ink/45">{t("oculto", "hidden")}</span>}
                            </span>
                            <span className="block truncate text-xs text-ink/50">
                              {link.wide ? t("Fila", "Row") : t("Tarjeta", "Card")} · {link.clicks}{" "}
                              {link.clicks === 1 ? t("clic", "click") : t("clics", "clicks")}
                              {link.badge ? ` · ${link.badge}` : link.id === top?.id ? ` · ${t("Más clics", "Most clicks")}` : ""}
                              {link.pill ? ` · ${link.pill}` : ""}
                            </span>
                          </button>
                          <IconButton label={link.hidden ? t("Mostrar", "Show") : t("Ocultar", "Hide")} onClick={() => patchLink(link, { hidden: !link.hidden })}>
                            {link.hidden ? "◌" : "◉"}
                          </IconButton>
                          <IconButton label={t("Subir", "Move up")} disabled={li === 0} onClick={() => stepLink(group, li, -1)}>
                            ▲
                          </IconButton>
                          <IconButton label={t("Bajar", "Move down")} disabled={li === group.links.length - 1} onClick={() => stepLink(group, li, 1)}>
                            ▼
                          </IconButton>
                        </div>
                        {open === `link:${link.id}` && (
                          <div className="border-t border-line p-sp-3">
                            <LinkForm
                              link={link}
                              groupId={group.id}
                              onSaved={(saved) => onLinkSaved(saved, false)}
                              onCancel={() => setOpen(`group:${group.id}`)}
                              extra={
                                <div className="flex flex-wrap items-center gap-sp-3">
                                  {customGroups.length > 1 && (
                                    <label className="flex items-center gap-sp-2 text-xs text-ink/70">
                                      {t("Mover a", "Move to")}
                                      <select
                                        value={group.id}
                                        onChange={(e) => moveLink(link.id, e.target.value)}
                                        className="rounded-md border border-line bg-white px-sp-2 py-1 text-xs"
                                      >
                                        {customGroups.map((g) => (
                                          <option key={g.id} value={g.id}>
                                            {g.title}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  )}
                                  <button type="button" onClick={() => deleteLink(link)} className="text-xs font-semibold text-red-600 hover:underline">
                                    {t("Eliminar enlace", "Delete link")}
                                  </button>
                                </div>
                              }
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  {open === `new:${group.id}` ? (
                    <div id={`edit-new:${group.id}`} className="rounded-[14px] border border-coral bg-white p-sp-3">
                      <LinkForm groupId={group.id} onSaved={(saved) => onLinkSaved(saved, true)} onCancel={() => setOpen(target)} />
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-sp-2">
                      <button type="button" onClick={() => setOpen(`new:${group.id}`)} className={secondaryButtonClass}>
                        {t("+ Agregar enlace", "+ Add link")}
                      </button>
                      <button type="button" onClick={() => deleteGroup(group)} className="text-xs font-semibold text-red-600 hover:underline">
                        {t("Eliminar grupo", "Delete group")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </Block>
          );
        })}

        <form onSubmit={addGroup} className="flex flex-wrap items-center gap-sp-2 rounded-[18px] border border-dashed border-line bg-white/60 p-sp-3">
          <input
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            maxLength={40}
            placeholder={t("Nuevo grupo: “Colabora conmigo”, “Mis favoritos”…", "New group: “Work with me”, “My favorites”…")}
            aria-label={t("Nombre del nuevo grupo", "New group name")}
            className={`${inputClass} min-w-[200px] flex-1`}
          />
          <button type="submit" disabled={!newGroup.trim()} className={primaryButtonClass}>
            {t("+ Nuevo grupo", "+ New group")}
          </button>
        </form>
      </div>

      <div className="xl:sticky xl:top-sp-4">
        <Card className="flex flex-col items-center gap-sp-3">
          <div className="flex w-full items-center justify-between">
            <p className={eyebrow}>{t("Vista previa · toca para editar", "Preview · tap to edit")}</p>
            <button type="button" onClick={() => setFrameKey((k) => k + 1)} className="text-xs font-semibold text-ink/55 hover:text-ink">
              ↻
            </button>
          </div>
          <div className="h-[720px] w-[360px] max-w-full overflow-hidden rounded-[36px] border-[6px] border-ink bg-white">
            <iframe ref={frame} key={frameKey} title={t("Vista previa del link en bio", "Link in bio preview")} src={previewReady ? `${previewPath}?editor=1` : undefined} className="h-full w-full border-0" />
          </div>
        </Card>
      </div>

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          description={confirm.description}
          onConfirm={() => {
            confirm.run();
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function SaveStatus({ status }: { status: Status }) {
  const { t } = useT();
  if (status === "idle") return null;
  const text = { saving: t("Guardando…", "Saving…"), saved: t("Guardado ✓", "Saved ✓"), error: t("No se guardó", "Not saved") }[status];
  return (
    <span role="status" className={`text-xs font-semibold ${status === "error" ? "text-red-600" : status === "saved" ? "text-moss" : "text-ink/50"}`}>
      {text}
    </span>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-ink/55 transition hover:bg-cream hover:text-ink disabled:opacity-25"
    >
      {children}
    </button>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-sp-3 text-sm text-ink/80">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-coral" : "bg-ink/20"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

/** Tarjeta de un bloque: cabecera con mover / ocultar / abrir y el contenido editable debajo. */
function Block({
  id,
  title,
  subtitle,
  open,
  onToggle,
  hidden = false,
  onHide,
  onUp,
  onDown,
  fixed = false,
  draggable = false,
  onDragStart,
  onDrop,
  dropActive = false,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  hidden?: boolean;
  onHide?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  fixed?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onDrop?: () => void;
  dropActive?: boolean;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const { t } = useT();
  return (
    <section
      id={`edit-${id}`}
      onDragOver={(e) => {
        if (!dropActive) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={() => {
        setOver(false);
        onDrop?.();
      }}
      className={`rounded-[18px] border bg-white shadow-[0_1px_2px_rgba(36,18,39,0.04)] transition ${
        open ? "border-coral ring-2 ring-coral/15" : over ? "border-coral border-dashed" : "border-line"
      }`}
    >
      <div className="flex items-center gap-sp-2 p-sp-3">
        {fixed ? (
          <span title={t("Siempre arriba", "Always on top")} className="px-1 text-xs text-ink/30">
            📌
          </span>
        ) : (
          <span
            draggable={draggable}
            onDragStart={onDragStart}
            title={t("Arrastra para mover el bloque", "Drag to move the block")}
            className="cursor-grab select-none px-1 text-ink/35 active:cursor-grabbing"
          >
            ⋮⋮
          </span>
        )}
        <button type="button" onClick={onToggle} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className={`block truncate font-semibold ${hidden ? "text-ink/40 line-through" : "text-ink"}`}>{title}</span>
          <span className="block truncate text-xs text-ink/50">{hidden ? t("Oculto en tu página", "Hidden on your page") : subtitle}</span>
        </button>
        {onHide && (
          <IconButton label={hidden ? t("Mostrar", "Show") : t("Ocultar", "Hide")} onClick={onHide}>
            {hidden ? "◌" : "◉"}
          </IconButton>
        )}
        {!fixed && (
          <>
            <IconButton label={t("Subir bloque", "Move block up")} disabled={!onUp} onClick={() => onUp?.()}>
              ▲
            </IconButton>
            <IconButton label={t("Bajar bloque", "Move block down")} disabled={!onDown} onClick={() => onDown?.()}>
              ▼
            </IconButton>
          </>
        )}
        <IconButton label={open ? t("Cerrar", "Close") : t("Editar", "Edit")} onClick={onToggle}>
          {open ? "−" : "✎"}
        </IconButton>
      </div>
      {open && <div className="flex flex-col gap-sp-4 border-t border-line p-sp-4">{children}</div>}
    </section>
  );
}

function GroupTitleEditor({ group, placeholder, onSave }: { group: Group; placeholder?: string; onSave: (data: { title: string; titleEn: string }) => void }) {
  const { t } = useT();
  const [title, setTitle] = useState(group.title);
  const [titleEn, setTitleEn] = useState(group.titleEn ?? "");
  const dirty = title !== group.title || titleEn !== (group.titleEn ?? "");
  const canSave = dirty && (group.kind !== "custom" || title.trim());
  return (
    <div className="flex flex-wrap items-end gap-sp-3">
      <label className="flex min-w-[160px] flex-1 flex-col gap-sp-1">
        <span className="text-xs font-medium text-ink/70">{t("Título del grupo", "Group title")}</span>
        <input value={title} maxLength={40} placeholder={placeholder} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </label>
      <label className="flex min-w-[160px] flex-1 flex-col gap-sp-1">
        <span className="text-xs font-medium text-ink/70">{t("En inglés", "In English")}</span>
        <input value={titleEn} maxLength={40} onChange={(e) => setTitleEn(e.target.value)} className={inputClass} />
      </label>
      {canSave && (
        <button type="button" onClick={() => onSave({ title: title.trim(), titleEn: titleEn.trim() })} className={secondaryButtonClass}>
          {t("Guardar título", "Save title")}
        </button>
      )}
    </div>
  );
}

const EMPTY = { title: "", titleEn: "", url: "https://", imageUrl: "", pill: "", wide: true, kicker: "", kickerEn: "", badge: "", badgeEn: "" };

/** Formulario de un enlace (nuevo o existente), dentro de su grupo. */
function LinkForm({
  link,
  groupId,
  onSaved,
  onCancel,
  extra,
}: {
  link?: BioLink;
  groupId: string;
  onSaved: (link: BioLink) => void;
  onCancel: () => void;
  extra?: React.ReactNode;
}) {
  const { showToast } = useToast();
  const { t } = useT();
  const [form, setForm] = useState(
    link
      ? {
          title: link.title,
          titleEn: link.titleEn ?? "",
          url: link.url,
          imageUrl: link.imageUrl ?? "",
          pill: link.pill ?? "",
          wide: link.wide,
          kicker: link.kicker ?? "",
          kickerEn: link.kickerEn ?? "",
          badge: link.badge ?? "",
          badgeEn: link.badgeEn ?? "",
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(link ? `/api/admin/links/${link.id}` : "/api/admin/links", {
      method: link ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, groupId }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar el enlace", "Couldn't save the link"));
    showToast("success", link ? t("Enlace actualizado", "Link updated") : t("Enlace agregado", "Link added"));
    onSaved(data);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sp-4">
      <BilingualTextField label={t("Título", "Title")} es={form.title} en={form.titleEn} onEsChange={(v) => set("title", v)} onEnChange={(v) => set("titleEn", v)} required />
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">{t("Enlace", "Link")}</span>
        <input required type="url" value={form.url} onChange={(e) => set("url", e.target.value)} className={inputClass} placeholder="https://" />
      </label>
      <p className="-mt-sp-3 text-xs text-ink/50">{t("PayPal, tiendas, redes y correo llevan su ícono solo si no subes imagen.", "PayPal, stores, socials and email get their own icon automatically if you don't upload an image.")}</p>
      <div className="grid gap-sp-4 sm:grid-cols-[170px_1fr]">
        <ImageUploadField
          label={t("Imagen o logo", "Image or logo")}
          value={form.imageUrl}
          onChange={(url) => set("imageUrl", url)}
          aspect={form.wide ? [...LINK_IMAGE_ASPECT_OPTIONS].reverse() : LINK_IMAGE_ASPECT_OPTIONS}
          recommendedSize={form.wide ? "1200 × 400 px" : "600 × 600 px"}
        />
        <fieldset className="flex flex-col gap-sp-2">
          <legend className="text-sm font-medium text-ink">{t("Cómo se ve", "How it looks")}</legend>
          <label className="flex items-center gap-sp-2 text-sm text-ink/80">
            <input type="radio" checked={form.wide} onChange={() => set("wide", true)} /> {t("Fila a todo el ancho", "Full-width row")}
          </label>
          <label className="flex items-center gap-sp-2 text-sm text-ink/80">
            <input type="radio" checked={!form.wide} onChange={() => set("wide", false)} /> {t("Tarjeta (dos por fila)", "Card (two per row)")}
          </label>
          <label className="mt-sp-2 flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">{t("Descuento o etiqueta corta", "Discount or short tag")}</span>
            <input value={form.pill} maxLength={14} onChange={(e) => set("pill", e.target.value)} className={inputClass} placeholder={t("15% OFF, Nuevo…", "15% OFF, New…")} />
          </label>
        </fieldset>
      </div>
      <div className="grid gap-sp-4 sm:grid-cols-2">
        <BilingualTextField label={t("Palabra de acción (tarjeta)", "Action word (card)")} es={form.kicker} en={form.kickerEn} onEsChange={(v) => set("kicker", v)} onEnChange={(v) => set("kickerEn", v)} />
        <BilingualTextField label={t("Etiqueta destacada", "Highlight tag")} es={form.badge} en={form.badgeEn} onEsChange={(v) => set("badge", v)} onEnChange={(v) => set("badgeEn", v)} />
      </div>
      <p className="-mt-sp-2 text-xs text-ink/50">
        {t(
          "Acción: “Comprar”, “Únete”. Destacada (en tu color): “Abierto ahora”. Si no pones una, el enlace más visitado lleva “Más clics” solo.",
          "Action: “Shop”, “Join”. Highlight (in your color): “Open now”. If you don't set one, your most visited link gets “Most clicks” automatically."
        )}
      </p>
      {extra}
      <div className="flex gap-sp-3">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? t("Guardando…", "Saving…") : link ? t("Guardar cambios", "Save changes") : t("+ Agregar enlace", "+ Add link")}
        </button>
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          {link ? t("Cerrar", "Close") : t("Cancelar", "Cancel")}
        </button>
      </div>
    </form>
  );
}
