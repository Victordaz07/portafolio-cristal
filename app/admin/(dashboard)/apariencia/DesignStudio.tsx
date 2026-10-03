"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ImageUploadField from "@/components/admin/ImageUploadField";
import BilingualTextField from "@/components/admin/BilingualTextField";
import ReorderButtons from "@/components/admin/ReorderButtons";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { ACCENTS, accentVars, paletteFromHex, type AccentId } from "@/lib/theme";
import { LINK_PATTERNS, patternImage, type LinkPatternId } from "@/lib/bio-links";
import {
  BACKGROUNDS,
  CORNERS,
  DEFAULT_DESIGN,
  FONTS,
  HEROES,
  SECTIONS,
  STYLES,
  encodePreview,
  type BackgroundId,
  type CornerId,
  type Design,
  type FontId,
  type HeroId,
  type StyleDef,
  type StyleId,
} from "@/lib/design";

interface Profile {
  name: string;
  photoUrl: string;
  description: string;
  descriptionEn: string;
}

const eyebrow = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";
const tile = (selected: boolean) =>
  `flex flex-col gap-sp-2 rounded-[14px] border p-sp-2 text-left transition ${selected ? "border-ink ring-2 ring-ink/20" : "border-line hover:border-ink/40"}`;

export default function DesignStudio({
  initialProfile,
  initialDesign,
  previewPath,
  siteUrl,
}: {
  initialProfile: Profile;
  initialDesign: Design;
  previewPath: string;
  siteUrl: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(initialProfile);
  const [design, setDesign] = useState(initialDesign);
  const [saved, setSaved] = useState({ profile: initialProfile, design: initialDesign });
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile" | "links">("desktop");
  const [suggestion, setSuggestion] = useState<{ reason: string; source: string; warning?: string } | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const attempt = useRef(0);

  const dirty = JSON.stringify({ profile, design }) !== JSON.stringify(saved);
  const set = <K extends keyof Design>(key: K, value: Design[K]) => setDesign((d) => ({ ...d, [key]: value }));
  const setP = <K extends keyof Profile>(key: K, value: Profile[K]) => setProfile((p) => ({ ...p, [key]: value }));

  function chooseStyle(id: StyleId) {
    const style: StyleDef = STYLES[id];
    setDesign((d) => ({ ...d, style: id, ...style.defaults }));
  }

  async function designForMe() {
    setSuggesting(true);
    const response = await fetch("/api/admin/design/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio: profile.description,
        attempt: attempt.current,
        current: suggestion ? { style: design.style, font: design.font, accent: design.accent, hero: design.hero } : undefined,
      }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setSuggesting(false);
    if (!response?.ok || !data?.suggestion) return showToast("error", data?.error ?? "No se pudo proponer un diseño");
    attempt.current += 1;
    const s = data.suggestion;
    setDesign((d) => ({ ...d, style: s.style, font: s.font, accent: s.accent, customAccent: d.customAccent, hero: s.hero, corners: s.corners, background: s.background }));
    setSuggestion({ reason: s.reason, source: data.source, warning: data.warning });
  }

  async function save() {
    setSaving(true);
    const response = await fetch("/api/admin/appearance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, accentColor: design.accent, ...design }),
    }).catch(() => null);
    const data = await response?.json().catch(() => ({}));
    setSaving(false);
    if (!response?.ok) return showToast("error", data?.error ?? "No se pudo guardar");
    setSaved({ profile, design });
    showToast("success", "Diseño guardado: ya se ve en tu sitio");
    router.refresh(); // el panel también toma el color nuevo
  }

  const custom = design.customAccent ? paletteFromHex(design.customAccent) : null;

  return (
    <div className="grid items-start gap-sp-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col gap-sp-4">
        <Card className="flex flex-col gap-sp-3">
          <div className="flex flex-wrap items-center justify-between gap-sp-3">
            <div>
              <p className={eyebrow}>Diséñalo por mí</p>
              <p className="mt-1 text-sm text-ink/70">Claude propone estilo, tipografía, color y portada según tu nicho y tu bio.</p>
            </div>
            <button type="button" onClick={designForMe} disabled={suggesting} className={primaryButtonClass}>
              {suggesting ? "Pensando…" : suggestion ? "✨ Otra idea" : "✨ Diséñalo por mí"}
            </button>
          </div>
          {suggestion && (
            <p role="status" className="rounded-[12px] bg-cream p-sp-3 text-sm text-ink/80">
              {suggestion.reason}
              <span className="mt-1 block text-xs text-ink/50">
                {suggestion.source === "claude" ? "Propuesta de Claude" : "Propuesta sugerida para tu nicho"} · Ya está en la vista previa; guarda si te gusta.
                {suggestion.warning ? ` (${suggestion.warning})` : ""}
              </span>
            </p>
          )}
        </Card>

        <Card>
          <p className={eyebrow}>Estilo</p>
          <p className="mt-1 text-xs text-ink/55">Cambia fondo, colores base y el resto de opciones de un clic. Después puedes ajustar cada detalle.</p>
          <div className="mt-sp-3 grid grid-cols-2 gap-sp-3 sm:grid-cols-3 lg:grid-cols-5">
            {(Object.keys(STYLES) as StyleId[]).map((id) => {
              const style: StyleDef = STYLES[id];
              const c = style.colors;
              return (
                <button key={id} type="button" aria-pressed={design.style === id} onClick={() => chooseStyle(id)} className={tile(design.style === id)}>
                  <span className="flex h-16 flex-col justify-between rounded-[10px] border border-line p-1.5" style={{ background: c.bg }}>
                    <span className="h-1.5 w-10 rounded-full" style={{ background: c.ink }} />
                    <span className="flex items-end justify-between">
                      <span className="h-6 w-8 rounded-[4px]" style={{ background: c.surface, border: `1px solid ${c.ink}22` }} />
                      <span className="h-2.5 w-7 rounded-full" style={{ background: c.inverse }} />
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-ink">{style.label}</span>
                  <span className="text-[11px] leading-tight text-ink/55">{style.description}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <p className={eyebrow}>Color de acento</p>
          <p className="mt-1 text-xs text-ink/55">Botones, enlaces, etiquetas y detalles del sitio y de este panel.</p>
          <div className="mt-sp-3 grid grid-cols-4 gap-sp-3 sm:grid-cols-7">
            {(Object.keys(ACCENTS) as AccentId[]).map((id) => {
              const palette = ACCENTS[id];
              return (
                <button key={id} type="button" aria-pressed={design.accent === id} onClick={() => set("accent", id)} className={`${tile(design.accent === id)} items-center`}>
                  <span className="flex">
                    <span className="h-6 w-6 rounded-full ring-2 ring-white" style={{ background: palette.accent }} />
                    <span className="-ml-2 h-6 w-6 rounded-full ring-2 ring-white" style={{ background: palette.dark }} />
                    <span className="-ml-2 h-6 w-6 rounded-full ring-2 ring-white" style={{ background: palette.light }} />
                  </span>
                  <span className="text-[11px] font-semibold text-ink">{palette.label}</span>
                </button>
              );
            })}
            <label className={`${tile(design.accent === "custom")} cursor-pointer items-center`}>
              <span className="relative h-6 w-6 overflow-hidden rounded-full ring-2 ring-white" style={{ background: custom?.accent ?? "conic-gradient(#f43f5e,#f59e0b,#10b981,#3b82f6,#a855f7,#f43f5e)" }}>
                <input
                  type="color"
                  aria-label="Color propio"
                  value={design.customAccent ?? "#A866BE"}
                  onChange={(e) => setDesign((d) => ({ ...d, accent: "custom", customAccent: e.target.value.toUpperCase() }))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </span>
              <span className="text-[11px] font-semibold text-ink">Propio</span>
            </label>
          </div>
          {design.accent === "custom" && custom && (
            <div className="mt-sp-3 flex flex-wrap items-center gap-sp-3 text-xs text-ink/65">
              <input
                aria-label="Código del color"
                value={design.customAccent ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) setDesign((d) => ({ ...d, customAccent: v.toUpperCase() }));
                }}
                placeholder="#A866BE"
                className={`${inputClass} w-28 font-mono`}
              />
              <span className="flex">
                {[custom.accent, custom.dark, custom.light].map((c) => (
                  <span key={c} className="-ml-1 h-5 w-5 rounded-full ring-2 ring-white first:ml-0" style={{ background: c }} />
                ))}
              </span>
              {custom.adjusted && <span>Lo oscurecimos un poco ({custom.accent}) para que el texto blanco de los botones se lea.</span>}
            </div>
          )}
        </Card>

        <Card>
          <p className={eyebrow}>Fondo decorativo · link en bio</p>
          <p className="mt-1 text-xs text-ink/55">Textura de tu página de enlaces, pintada con tu color de acento.</p>
          <div className="mt-sp-3 grid grid-cols-3 gap-sp-3 sm:grid-cols-6" style={accentVars(design.accent, design.customAccent) as React.CSSProperties}>
            {(Object.keys(LINK_PATTERNS) as LinkPatternId[]).map((id) => {
              const p = LINK_PATTERNS[id];
              return (
                <button key={id} type="button" aria-pressed={design.pattern === id} onClick={() => set("pattern", id)} className={`${tile(design.pattern === id)} items-center`}>
                  <span className="relative h-14 w-full overflow-hidden rounded-[10px] border border-line bg-[#FAF6F0]">
                    {patternImage(id, design.accent, { mini: true, dark: (STYLES[design.style] as StyleDef).dark }) ? (
                      <span
                        className="absolute inset-0 bg-cover"
                        style={{ backgroundImage: `url(${patternImage(id, design.accent, { mini: true })})` }}
                      />
                    ) : p.mask ? (
                      <span
                        className="absolute inset-0 bg-coral opacity-40"
                        style={{ maskImage: p.mask, WebkitMaskImage: p.mask, maskSize: "120px", WebkitMaskSize: "120px" }}
                      />
                    ) : (
                      <>
                        <span className="absolute -left-3 -top-3 h-10 w-10 rounded-full bg-lime opacity-70 blur-md" />
                        <span className="absolute -bottom-3 -right-3 h-10 w-10 rounded-full bg-sage opacity-60 blur-md" />
                      </>
                    )}
                  </span>
                  <span className="text-center text-[11px] font-semibold leading-tight text-ink">{p.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <p className={eyebrow}>Tipografía</p>
          <div className="mt-sp-3 grid grid-cols-2 gap-sp-3 sm:grid-cols-3">
            {(Object.keys(FONTS) as FontId[]).map((id) => {
              const font = FONTS[id];
              return (
                <button key={id} type="button" aria-pressed={design.font === id} onClick={() => set("font", id)} className={tile(design.font === id)}>
                  <span
                    className="text-3xl leading-none text-ink"
                    style={{ fontFamily: `var(${font.display})`, fontStyle: font.headingStyle, fontWeight: Math.min(font.headingWeight, 800) }}
                  >
                    Aa
                  </span>
                  <span className="text-xs font-semibold text-ink">{font.label}</span>
                  <span className="text-[11px] text-ink/55" style={{ fontFamily: `var(${font.body})` }}>
                    {font.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <p className={eyebrow}>Portada</p>
          <div className="mt-sp-3 grid grid-cols-2 gap-sp-3 sm:grid-cols-4">
            {(Object.keys(HEROES) as HeroId[]).map((id) => (
              <button key={id} type="button" aria-pressed={design.hero === id} onClick={() => set("hero", id)} className={tile(design.hero === id)}>
                <HeroSketch id={id} />
                <span className="text-xs font-semibold text-ink">{HEROES[id].label}</span>
                <span className="text-[11px] leading-tight text-ink/55">{HEROES[id].hint}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid gap-sp-4 md:grid-cols-2">
          <Card>
            <p className={eyebrow}>Bordes</p>
            <div className="mt-sp-3 grid grid-cols-3 gap-sp-2">
              {(Object.keys(CORNERS) as CornerId[]).map((id) => (
                <button key={id} type="button" aria-pressed={design.corners === id} onClick={() => set("corners", id)} className={`${tile(design.corners === id)} items-center`}>
                  <span className="h-8 w-12 border-2 border-ink/60" style={{ borderRadius: 10 * CORNERS[id].scale }} />
                  <span className="text-[11px] font-semibold text-ink">{CORNERS[id].label}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <p className={eyebrow}>Fondo</p>
            <div className="mt-sp-3 grid grid-cols-3 gap-sp-2">
              {(Object.keys(BACKGROUNDS) as BackgroundId[]).map((id) => (
                <button key={id} type="button" aria-pressed={design.background === id} onClick={() => set("background", id)} className={`${tile(design.background === id)} items-center`}>
                  <span
                    className={`h-8 w-12 rounded-[6px] border border-line ${id === "textura" ? "bg-[url('/images/pattern-bg.webp')] bg-cream" : id === "degradado" ? "bg-gradient-to-b from-lime/60 to-cream" : "bg-cream"}`}
                  />
                  <span className="text-[11px] font-semibold text-ink">{BACKGROUNDS[id].label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <p className={eyebrow}>Orden de las secciones</p>
          <p className="mt-1 text-xs text-ink/55">La portada va siempre arriba y el contacto al final. Las secciones vacías no se muestran aunque estén visibles.</p>
          <ol className="mt-sp-3 flex flex-col gap-sp-2">
            {design.sections.map((section, index) => (
              <li key={section.id} className={`flex items-center gap-sp-3 rounded-[12px] border border-line px-sp-3 py-sp-2 ${section.hidden ? "bg-cream/60" : "bg-white"}`}>
                <ReorderButtons
                  onUp={() => set("sections", move(design.sections, index, -1))}
                  onDown={() => set("sections", move(design.sections, index, 1))}
                  disableUp={index === 0}
                  disableDown={index === design.sections.length - 1}
                />
                <span className={`flex-1 text-sm ${section.hidden ? "text-ink/40 line-through" : "text-ink"}`}>{SECTIONS[section.id]}</span>
                <button
                  type="button"
                  onClick={() => set("sections", design.sections.map((s) => (s.id === section.id ? { ...s, hidden: !s.hidden } : s)))}
                  aria-label={`${section.hidden ? "Mostrar" : "Ocultar"} ${SECTIONS[section.id]}`}
                  className="rounded-full border border-line px-sp-3 py-1 text-xs font-semibold text-ink/70 hover:border-coral hover:text-ink"
                >
                  {section.hidden ? "Mostrar" : "Ocultar"}
                </button>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="flex flex-col gap-sp-4">
          <p className={eyebrow}>Tu perfil</p>
          <div className="grid gap-sp-4 sm:grid-cols-[160px_1fr]">
            <ImageUploadField label="Foto de perfil" value={profile.photoUrl} onChange={(url) => setP("photoUrl", url)} />
            <div className="flex flex-col gap-sp-4">
              <label className="flex flex-col gap-sp-1">
                <span className="text-sm font-medium text-ink">Nombre público</span>
                <input required value={profile.name} onChange={(e) => setP("name", e.target.value)} className={inputClass} />
              </label>
              <BilingualTextField
                label="Bio (la descripción de la portada)"
                es={profile.description}
                en={profile.descriptionEn}
                onEsChange={(v) => setP("description", v)}
                onEnChange={(v) => setP("descriptionEn", v)}
                multiline
                rows={3}
              />
            </div>
          </div>
          <p className="text-xs text-ink/50">La foto, el nombre y la bio aparecen en la vista previa cuando guardas.</p>
        </Card>

        <div className="sticky bottom-sp-3 z-10 flex flex-wrap items-center gap-sp-3 rounded-[16px] border border-line bg-white/95 p-sp-3 shadow-lg backdrop-blur">
          <button type="button" onClick={save} disabled={saving || !dirty || !profile.name.trim()} className={primaryButtonClass}>
            {saving ? "Guardando…" : dirty ? "Guardar diseño" : "Guardado"}
          </button>
          <button
            type="button"
            onClick={() => setDesign((d) => ({ ...DEFAULT_DESIGN, sections: d.sections }))}
            className={secondaryButtonClass}
          >
            Volver al original
          </button>
          {dirty && <span className="text-xs text-ink/55">Tienes cambios sin guardar.</span>}
          <a href={siteUrl} target="_blank" rel="noreferrer" className="ml-auto text-sm font-semibold text-coral hover:underline">
            Ver mi sitio ↗
          </a>
        </div>
      </div>

      <div className="xl:sticky xl:top-sp-4">
        <Card className="flex flex-col gap-sp-3">
          <div className="flex items-center justify-between gap-sp-3">
            <p className={eyebrow}>Vista previa en vivo</p>
            <div role="group" aria-label="Dispositivo" className="flex rounded-full border border-line p-0.5 text-xs font-semibold">
              {(["desktop", "mobile", "links"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={device === d}
                  onClick={() => setDevice(d)}
                  className={`rounded-full px-sp-3 py-1 transition ${device === d ? "bg-ink text-cream" : "text-ink/60 hover:text-ink"}`}
                >
                  {d === "desktop" ? "Computadora" : d === "mobile" ? "Celular" : "Link en bio"}
                </button>
              ))}
            </div>
          </div>
          <Preview
            path={device === "links" ? `${previewPath.replace(/\/$/, "")}/enlaces` : previewPath}
            design={design}
            device={device === "desktop" ? "desktop" : "mobile"}
          />
        </Card>
      </div>
    </div>
  );
}

function move<T>(list: T[], index: number, delta: number) {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + delta, 0, item);
  return next;
}

/** El sitio real en un iframe, con el diseño sin guardar (?disenio=…), escalado para que quepa. */
function Preview({ path, design, device }: { path: string; design: Design; device: "desktop" | "mobile" }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const encoded = useMemo(() => encodePreview(design), [design]);
  const [src, setSrc] = useState(`${path}?disenio=${encoded}`);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setSrc(`${path}?disenio=${encoded}`);
    }, 350);
    return () => clearTimeout(t);
  }, [path, encoded]);

  useEffect(() => {
    if (!box.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  const height = 680;
  const frame = device === "desktop" ? { w: 1280, h: 0 } : { w: 390, h: 844 };
  const scale = device === "desktop" ? width / frame.w : Math.min(height / frame.h, width / frame.w);
  const frameHeight = device === "desktop" ? height / scale : frame.h;

  return (
    <div ref={box} className="relative overflow-hidden rounded-[14px] border border-line bg-cream" style={{ height }}>
      <div
        className={device === "mobile" ? "absolute left-1/2 top-0 overflow-hidden rounded-[28px] border-4 border-ink" : "absolute left-0 top-0"}
        style={{
          width: frame.w,
          height: frameHeight,
          transform: device === "mobile" ? `translateX(-50%) scale(${scale})` : `scale(${scale})`,
          transformOrigin: device === "mobile" ? "top center" : "top left",
        }}
      >
        <iframe title="Vista previa de tu sitio" src={src} onLoad={() => setLoading(false)} className="h-full w-full border-0 bg-white" />
      </div>
      {loading && (
        <span className="absolute right-sp-3 top-sp-3 rounded-full bg-ink/80 px-sp-3 py-1 font-mono text-[10px] uppercase tracking-wide text-cream">Actualizando…</span>
      )}
    </div>
  );
}

/** Esquema mini de cada portada. */
function HeroSketch({ id }: { id: HeroId }) {
  const line = (w: string, dark = true) => <span className={`block h-1.5 rounded-full ${dark ? "bg-ink/70" : "bg-white/90"}`} style={{ width: w }} />;
  const photo = "bg-gradient-to-br from-lime to-coral";
  return (
    <span className="relative flex h-16 overflow-hidden rounded-[10px] border border-line bg-cream">
      {id === "split" && (
        <>
          <span className="flex flex-1 flex-col justify-center gap-1 p-1.5">
            {line("80%")}
            {line("55%")}
            <span className="mt-0.5 block h-2 w-6 rounded-full bg-coral" />
          </span>
          <span className={`w-2/5 ${photo}`} />
        </>
      )}
      {id === "cover" && (
        <span className={`flex flex-1 flex-col justify-end gap-1 p-1.5 ${photo}`}>
          {line("70%", false)}
          {line("45%", false)}
        </span>
      )}
      {id === "centered" && (
        <span className="flex flex-1 flex-col items-center justify-center gap-1">
          <span className={`h-6 w-6 rounded-full ${photo}`} />
          {line("50%")}
          {line("35%")}
        </span>
      )}
      {id === "magazine" && (
        <span className="flex flex-1 flex-col gap-1 p-1.5">
          <span className="block h-3 w-full rounded-[2px] bg-ink" />
          <span className="flex flex-1 gap-1">
            <span className={`w-2/5 rounded-[2px] ${photo}`} />
            <span className="flex flex-1 flex-col gap-1 pt-0.5">
              {line("90%")}
              {line("60%")}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
