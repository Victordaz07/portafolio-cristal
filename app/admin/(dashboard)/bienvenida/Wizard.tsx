"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { HERO_PHOTO_ASPECT_OPTIONS } from "@/lib/image-crop";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { ACCENTS, type AccentId } from "@/lib/theme";
import { siteTemplate, suggestedBio, type Niche } from "@/lib/onboarding";
import { parseEmbedUrl } from "@/lib/embeds";
import { CREATOR_KINDS, type CreatorKind } from "@/lib/creator-kind";

const STEPS = ["Tu perfil", "Tus textos", "Tu mejor contenido", "Contacto y color"];
const eyebrow = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

interface Initial {
  displayName: string;
  photoUrl: string;
  location: string;
  contactEmail: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  accentColor: string;
  creatorKind: CreatorKind;
}

export default function Wizard({ niches, initial }: { niches: Niche[]; initial: Initial }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ siteUrl: string } | null>(null);
  const [v, setV] = useState({
    ...initial,
    niche: "",
    bio: "",
    bioEn: "",
    bioEdited: false,
    useTemplates: { services: true, packages: true, faq: true },
    pieces: [
      { url: "", caption: "" },
      { url: "", caption: "" },
      { url: "", caption: "" },
    ],
  });

  const niche = niches.find((n) => n.id === v.niche);
  const template = useMemo(() => (niche ? siteTemplate(niche, v.creatorKind) : null), [niche, v.creatorKind]);
  const firstName = v.displayName.trim().split(" ")[0] || "…";

  function set<K extends keyof typeof v>(key: K, value: (typeof v)[K]) {
    setV((current) => {
      const next = { ...current, [key]: value };
      // La bio sugerida sigue al nicho y al nombre hasta que la creadora la edita.
      if ((key === "niche" || key === "displayName" || key === "creatorKind") && !current.bioEdited) {
        const n = niches.find((x) => x.id === next.niche);
        if (n) {
          const bio = suggestedBio(n, next.displayName.trim().split(" ")[0] || "", next.creatorKind);
          next.bio = bio.es;
          next.bioEn = bio.en;
        }
      }
      return next;
    });
  }

  function stepError(): string | null {
    if (step === 0) {
      if (v.displayName.trim().length < 2) return "Escribe tu nombre";
      if (!v.niche) return "Elige tu nicho";
    }
    if (step === 1 && v.bio.trim().length < 10) return "Escribe tu bio (al menos una frase)";
    if (step === 2) {
      for (const p of v.pieces) {
        if (p.url.trim() && !parseEmbedUrl(p.url.trim()).platform) return "Uno de los links no es de Instagram, TikTok ni Facebook";
      }
    }
    if (step === 3 && !/^\S+@\S+\.\S+$/.test(v.contactEmail.trim())) return "Escribe un correo válido para que las marcas te escriban";
    return null;
  }

  function next() {
    const error = stepError();
    if (error) return showToast("error", error);
    setStep((s) => s + 1);
  }

  async function finish() {
    const error = stepError();
    if (error) return showToast("error", error);
    setSaving(true);
    const response = await fetch("/api/admin/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: v.displayName,
        photoUrl: v.photoUrl,
        location: v.location,
        niche: v.niche,
        creatorKind: v.creatorKind,
        bio: v.bio,
        bioEn: v.bioEn,
        useTemplates: v.useTemplates,
        pieces: v.pieces.filter((p) => p.url.trim()).map((p) => ({ url: p.url.trim(), caption: p.caption })),
        contactEmail: v.contactEmail,
        instagram: v.instagram,
        tiktok: v.tiktok,
        whatsapp: v.whatsapp,
        accentColor: v.accentColor,
      }),
    });
    setSaving(false);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? "No se pudo crear tu sitio");
    setDone({ siteUrl: data.siteUrl });
    router.refresh();
  }

  async function skip() {
    await fetch("/api/admin/onboarding", { method: "PATCH" });
    router.push("/admin");
    router.refresh();
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-sp-5 py-sp-5">
        <Card className="text-center">
          <p className="text-4xl">🎉</p>
          <h1 className="mt-sp-3 font-fraunces text-3xl font-semibold italic text-ink">¡Tu sitio está listo, {firstName}!</h1>
          <p className="mt-sp-2 text-ink/65">Este es el link para compartir con las marcas, en tu bio y en tus correos:</p>
          <p className="mt-sp-4 break-all rounded-[12px] bg-cream px-sp-4 py-sp-3 font-mono text-sm text-ink">{done.siteUrl}</p>
          <div className="mt-sp-4 flex flex-wrap justify-center gap-sp-3">
            <a href={done.siteUrl} target="_blank" rel="noreferrer" className={primaryButtonClass}>
              Ver mi sitio ↗
            </a>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => navigator.clipboard.writeText(done.siteUrl).then(() => showToast("success", "Link copiado"))}
            >
              Copiar link
            </button>
          </div>
        </Card>
        <Card>
          <p className={`${eyebrow} mb-sp-3`}>Siguientes pasos</p>
          <ul className="flex flex-col gap-sp-3 text-sm">
            {[
              { href: "/admin/conectar", title: "Conecta tu Instagram y tu TikTok", text: "Tus seguidores y métricas se actualizan solos." },
              { href: "/admin/media-kit", title: "Agrega tus números", text: "Audiencia, colaboraciones y valoración para tu media kit." },
              { href: "/admin/feed", title: "Sube más contenido", text: "Tus mejores piezas, con sus métricas." },
              { href: "/admin/marcas", title: "Anota tus marcas", text: "Tratos, pagos y seguimientos en tu CRM." },
              { href: "/admin/dominio", title: "Conecta tu dominio", text: "Si tienes uno, como tunombre.com." },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex items-center justify-between gap-sp-3 rounded-[12px] border border-line px-sp-4 py-sp-3 hover:border-coral">
                  <span>
                    <span className="block font-semibold text-ink">{item.title}</span>
                    <span className="text-ink/55">{item.text}</span>
                  </span>
                  <span aria-hidden className="text-coral">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/admin" className="mt-sp-4 inline-block text-sm font-semibold text-coral hover:underline">
            Ir a mi panel →
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-sp-5 py-sp-3">
      <div className="flex flex-wrap items-end justify-between gap-sp-3">
        <div>
          <p className={eyebrow}>Te damos la bienvenida a Foliocrew</p>
          <h1 className="mt-sp-1 font-fraunces text-3xl font-semibold italic text-ink">Armemos tu sitio en 10 minutos</h1>
        </div>
        <button type="button" onClick={skip} className="text-xs text-ink/50 hover:text-ink">
          Saltar por ahora
        </button>
      </div>

      <div>
        <div className="mb-sp-2 flex justify-between text-xs text-ink/55">
          <span>
            Paso {step + 1} de {STEPS.length} · <strong className="text-ink">{STEPS[step]}</strong>
          </span>
        </div>
        <div className="flex gap-1" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-coral" : "bg-line"}`} />
          ))}
        </div>
      </div>

      <Card>
        {step === 0 && (
          <div className="flex flex-col gap-sp-4">
            <ImageUploadField
              label="Tu foto (la de la portada de tu sitio)"
              value={v.photoUrl}
              onChange={(url) => set("photoUrl", url)}
              aspect={HERO_PHOTO_ASPECT_OPTIONS}
              recommendedSize="1200 × 1500 px (vertical) o 1920 × 1080 px (horizontal)"
            />
            <div className="grid gap-sp-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className="text-sm font-medium text-ink">Tu nombre (como quieres que aparezca)</span>
                <input value={v.displayName} onChange={(e) => set("displayName", e.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className="text-sm font-medium text-ink">Ciudad / país (opcional)</span>
                <input value={v.location} onChange={(e) => set("location", e.target.value)} placeholder="Santo Domingo, RD" className={inputClass} />
              </label>
            </div>
            <div>
              <p className="mb-sp-2 text-sm font-medium text-ink">¿Cómo trabajas con marcas?</p>
              <div className="grid gap-sp-2 sm:grid-cols-3" role="radiogroup" aria-label="¿Cómo trabajas con marcas?">
                {CREATOR_KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    role="radio"
                    aria-checked={v.creatorKind === k.id}
                    onClick={() => set("creatorKind", k.id)}
                    className={`flex flex-col gap-1 rounded-[14px] border p-sp-3 text-left transition ${
                      v.creatorKind === k.id ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink hover:border-coral"
                    }`}
                  >
                    <span className="text-sm font-semibold">{k.label}</span>
                    <span className={`text-xs ${v.creatorKind === k.id ? "text-cream/75" : "text-ink/55"}`}>{k.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-sp-2 text-sm font-medium text-ink">¿De qué es tu contenido?</p>
              <div className="flex flex-wrap gap-sp-2">
                {niches.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => set("niche", n.id)}
                    aria-pressed={v.niche === n.id}
                    className={`rounded-full px-sp-4 py-sp-2 text-sm transition ${
                      v.niche === n.id ? "bg-ink text-cream" : "border border-line bg-white text-ink hover:border-coral"
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && template && (
          <div className="flex flex-col gap-sp-5">
            <div>
              <p className={`${eyebrow} mb-sp-2`}>Tu portada</p>
              <p className="font-fraunces text-2xl font-semibold text-ink">
                {template.hero.headlinePlain} <em className="text-coral">{template.hero.headlineEmphasis}</em> {template.hero.headlineSuffix}
              </p>
              <p className="mt-sp-1 text-xs text-ink/50">Elegida para {niche?.label}. La cambias cuando quieras en Portada (Hero).</p>
            </div>
            <label className={labelClass}>
              <span className="text-sm font-medium text-ink">Tu bio (español)</span>
              <textarea rows={3} value={v.bio} onChange={(e) => setV((c) => ({ ...c, bio: e.target.value, bioEdited: true }))} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span className="text-sm font-medium text-ink">Tu bio (inglés, para marcas de EE. UU.)</span>
              <textarea rows={3} value={v.bioEn} onChange={(e) => setV((c) => ({ ...c, bioEn: e.target.value, bioEdited: true }))} className={inputClass} />
            </label>
            <div>
              <p className={`${eyebrow} mb-sp-2`}>Agregar a tu sitio (podrás editarlo)</p>
              <div className="grid gap-sp-3 sm:grid-cols-3">
                {(
                  [
                    { key: "services", title: "Cómo trabajo", items: template.services.map((s) => s.title) },
                    { key: "packages", title: "Paquetes", items: template.packages.map((p) => `${p.emoji} ${p.name}`) },
                    { key: "faq", title: "Preguntas frecuentes", items: template.faq.map((f) => f.question) },
                  ] as const
                ).map((group) => (
                  <label
                    key={group.key}
                    className={`flex cursor-pointer flex-col gap-sp-2 rounded-[14px] border p-sp-3 text-sm ${
                      v.useTemplates[group.key] ? "border-coral bg-coral/5" : "border-line"
                    }`}
                  >
                    <span className="flex items-center gap-sp-2 font-semibold text-ink">
                      <input
                        type="checkbox"
                        checked={v.useTemplates[group.key]}
                        onChange={(e) => setV((c) => ({ ...c, useTemplates: { ...c.useTemplates, [group.key]: e.target.checked } }))}
                      />
                      {group.title}
                    </span>
                    <ul className="list-disc pl-sp-4 text-xs text-ink/60">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </label>
                ))}
              </div>
              <p className="mt-sp-2 text-xs text-ink/50">También se escribe tu texto de &quot;por qué trabajar conmigo&quot;. Todo queda en español e inglés.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-sp-4">
            <p className="text-sm text-ink/70">
              Pega el link de tus <strong>3 mejores videos o fotos</strong> de Instagram, TikTok o Facebook (los que mostrarías a una marca). Puedes
              dejarlo vacío y agregarlos después en Feed.
            </p>
            {v.pieces.map((piece, i) => {
              const platform = piece.url.trim() ? parseEmbedUrl(piece.url.trim()).platform : null;
              return (
                <div key={i} className="grid gap-sp-2 rounded-[14px] border border-line p-sp-3 sm:grid-cols-[1.3fr_1fr]">
                  <label className={labelClass}>
                    <span className="flex items-center justify-between text-xs font-medium text-ink">
                      Link {i + 1}
                      {piece.url.trim() && (
                        <span className={`font-mono text-[10px] uppercase ${platform ? "text-cobalt" : "text-red-600"}`}>
                          {platform ?? "no reconocido"}
                        </span>
                      )}
                    </span>
                    <input
                      value={piece.url}
                      onChange={(e) => set("pieces", v.pieces.map((p, j) => (j === i ? { ...p, url: e.target.value } : p)))}
                      placeholder="https://www.instagram.com/reel/…"
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span className="text-xs font-medium text-ink">Descripción corta</span>
                    <input
                      value={piece.caption}
                      onChange={(e) => set("pieces", v.pieces.map((p, j) => (j === i ? { ...p, caption: e.target.value } : p)))}
                      placeholder="Reseña sérum de vitamina C"
                      className={inputClass}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-sp-4">
            <label className={labelClass}>
              <span className="text-sm font-medium text-ink">Correo para marcas</span>
              <input type="email" value={v.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputClass} />
            </label>
            <div className="grid gap-sp-4 sm:grid-cols-3">
              <label className={labelClass}>
                <span className="text-sm font-medium text-ink">Instagram</span>
                <input value={v.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@tuusuario" className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className="text-sm font-medium text-ink">TikTok</span>
                <input value={v.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="@tuusuario" className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className="text-sm font-medium text-ink">WhatsApp (opcional)</span>
                <input value={v.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+1 809 000 0000" className={inputClass} />
              </label>
            </div>
            <div>
              <p className="mb-sp-2 text-sm font-medium text-ink">El color de tu sitio</p>
              <div className="flex flex-wrap gap-sp-3">
                {(Object.keys(ACCENTS) as AccentId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => set("accentColor", id)}
                    aria-pressed={v.accentColor === id}
                    className={`flex items-center gap-sp-2 rounded-full border px-sp-3 py-sp-2 text-sm ${
                      v.accentColor === id ? "border-ink" : "border-line hover:border-coral"
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full" style={{ background: ACCENTS[id].accent }} />
                    {ACCENTS[id].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-sp-3">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className={secondaryButtonClass}>
            ← Atrás
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className={primaryButtonClass}>
            Siguiente →
          </button>
        ) : (
          <button type="button" onClick={finish} disabled={saving} className={primaryButtonClass}>
            {saving ? "Creando tu sitio…" : "Crear mi sitio ✨"}
          </button>
        )}
      </div>
    </div>
  );
}
