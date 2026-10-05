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
import { pickLabel } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

const STEPS = ["Tu perfil", "Tus textos", "Tu mejor contenido", "Contacto y color"];
const STEPS_EN = ["Your profile", "Your copy", "Your best content", "Contact & color"];
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
  const { t, lang } = useT();
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
      if (v.displayName.trim().length < 2) return t("Escribe tu nombre", "Enter your name");
      if (!v.niche) return t("Elige tu nicho", "Pick your niche");
    }
    if (step === 1 && v.bio.trim().length < 10) return t("Escribe tu bio (al menos una frase)", "Write your bio (at least one sentence)");
    if (step === 2) {
      for (const p of v.pieces) {
        if (p.url.trim() && !parseEmbedUrl(p.url.trim()).platform) return t("Uno de los links no es de Instagram, TikTok ni Facebook", "One of the links isn't from Instagram, TikTok or Facebook");
      }
    }
    if (step === 3 && !/^\S+@\S+\.\S+$/.test(v.contactEmail.trim())) return t("Escribe un correo válido para que las marcas te escriban", "Enter a valid email so brands can reach you");
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
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo crear tu sitio", "Couldn't create your site"));
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
          <h1 className="mt-sp-3 font-fraunces text-3xl font-semibold italic text-ink">{t(`¡Tu sitio está listo, ${firstName}!`, `Your site is ready, ${firstName}!`)}</h1>
          <p className="mt-sp-2 text-ink/65">{t("Este es el link para compartir con las marcas, en tu bio y en tus correos:", "This is the link to share with brands, in your bio and in your emails:")}</p>
          <p className="mt-sp-4 break-all rounded-[12px] bg-cream px-sp-4 py-sp-3 font-mono text-sm text-ink">{done.siteUrl}</p>
          <div className="mt-sp-4 flex flex-wrap justify-center gap-sp-3">
            <a href={done.siteUrl} target="_blank" rel="noreferrer" className={primaryButtonClass}>
              {t("Ver mi sitio ↗", "View my site ↗")}
            </a>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => navigator.clipboard.writeText(done.siteUrl).then(() => showToast("success", t("Link copiado", "Link copied")))}
            >
              {t("Copiar link", "Copy link")}
            </button>
          </div>
        </Card>
        <Card>
          <p className={`${eyebrow} mb-sp-3`}>{t("Siguientes pasos", "Next steps")}</p>
          <ul className="flex flex-col gap-sp-3 text-sm">
            {[
              { href: "/admin/conectar", title: t("Conecta tu Instagram y tu TikTok", "Connect your Instagram and TikTok"), text: t("Tus seguidores y métricas se actualizan solos.", "Your followers and metrics update on their own.") },
              { href: "/admin/media-kit", title: t("Agrega tus números", "Add your numbers"), text: t("Audiencia, colaboraciones y valoración para tu media kit.", "Audience, collaborations and rating for your media kit.") },
              { href: "/admin/feed", title: t("Sube más contenido", "Upload more content"), text: t("Tus mejores piezas, con sus métricas.", "Your best pieces, with their metrics.") },
              { href: "/admin/marcas", title: t("Anota tus marcas", "Track your brands"), text: t("Tratos, pagos y seguimientos en tu CRM.", "Deals, payments and follow-ups in your CRM.") },
              { href: "/admin/dominio", title: t("Conecta tu dominio", "Connect your domain"), text: t("Si tienes uno, como tunombre.com.", "If you have one, like yourname.com.") },
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
            {t("Ir a mi panel →", "Go to my dashboard →")}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-sp-5 py-sp-3">
      <div className="flex flex-wrap items-end justify-between gap-sp-3">
        <div>
          <p className={eyebrow}>{t("Te damos la bienvenida a Foliocrew", "Welcome to Foliocrew")}</p>
          <h1 className="mt-sp-1 font-fraunces text-3xl font-semibold italic text-ink">{t("Armemos tu sitio en 10 minutos", "Let's build your site in 10 minutes")}</h1>
        </div>
        <button type="button" onClick={skip} className="text-xs text-ink/50 hover:text-ink">
          {t("Saltar por ahora", "Skip for now")}
        </button>
      </div>

      <div>
        <div className="mb-sp-2 flex justify-between text-xs text-ink/55">
          <span>
            {t(`Paso ${step + 1} de ${STEPS.length}`, `Step ${step + 1} of ${STEPS.length}`)} ·{" "}
            <strong className="text-ink">{(lang === "en" ? STEPS_EN : STEPS)[step]}</strong>
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
              label={t("Tu foto (la de la portada de tu sitio)", "Your photo (your site's cover)")}
              value={v.photoUrl}
              onChange={(url) => set("photoUrl", url)}
              aspect={HERO_PHOTO_ASPECT_OPTIONS}
              recommendedSize={t("1200 × 1500 px (vertical) o 1920 × 1080 px (horizontal)", "1200 × 1500 px (portrait) or 1920 × 1080 px (landscape)")}
            />
            <div className="grid gap-sp-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className="text-sm font-medium text-ink">{t("Tu nombre (como quieres que aparezca)", "Your name (as you want it to appear)")}</span>
                <input value={v.displayName} onChange={(e) => set("displayName", e.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className="text-sm font-medium text-ink">{t("Ciudad / país (opcional)", "City / country (optional)")}</span>
                <input value={v.location} onChange={(e) => set("location", e.target.value)} placeholder={t("Santo Domingo, RD", "Miami, FL")} className={inputClass} />
              </label>
            </div>
            <div>
              <p className="mb-sp-2 text-sm font-medium text-ink">{t("¿Cómo trabajas con marcas?", "How do you work with brands?")}</p>
              <div className="grid gap-sp-2 sm:grid-cols-3" role="radiogroup" aria-label={t("¿Cómo trabajas con marcas?", "How do you work with brands?")}>
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
                    <span className="text-sm font-semibold">{pickLabel(lang, k)}</span>
                    <span className={`text-xs ${v.creatorKind === k.id ? "text-cream/75" : "text-ink/55"}`}>{lang === "en" ? k.hintEn : k.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-sp-2 text-sm font-medium text-ink">{t("¿De qué es tu contenido?", "What's your content about?")}</p>
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
                    {pickLabel(lang, n)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && template && (
          <div className="flex flex-col gap-sp-5">
            <div>
              <p className={`${eyebrow} mb-sp-2`}>{t("Tu portada", "Your cover")}</p>
              <p className="font-fraunces text-2xl font-semibold text-ink">
                {lang === "en" ? (
                  <>
                    {template.hero.headlinePlainEn} <em className="text-coral">{template.hero.headlineEmphasisEn}</em> {template.hero.headlineSuffixEn}
                  </>
                ) : (
                  <>
                    {template.hero.headlinePlain} <em className="text-coral">{template.hero.headlineEmphasis}</em> {template.hero.headlineSuffix}
                  </>
                )}
              </p>
              <p className="mt-sp-1 text-xs text-ink/50">
                {t(
                  `Elegida para ${niche?.label}. La cambias cuando quieras en Portada (Hero).`,
                  `Chosen for ${niche?.labelEn}. Change it anytime in Cover (Hero).`
                )}
              </p>
            </div>
            <label className={labelClass}>
              <span className="text-sm font-medium text-ink">{t("Tu bio (español)", "Your bio (Spanish)")}</span>
              <textarea rows={3} value={v.bio} onChange={(e) => setV((c) => ({ ...c, bio: e.target.value, bioEdited: true }))} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span className="text-sm font-medium text-ink">{t("Tu bio (inglés, para marcas de EE. UU.)", "Your bio (English, for US brands)")}</span>
              <textarea rows={3} value={v.bioEn} onChange={(e) => setV((c) => ({ ...c, bioEn: e.target.value, bioEdited: true }))} className={inputClass} />
            </label>
            <div>
              <p className={`${eyebrow} mb-sp-2`}>{t("Agregar a tu sitio (podrás editarlo)", "Add to your site (you can edit it)")}</p>
              <div className="grid gap-sp-3 sm:grid-cols-3">
                {(
                  [
                    { key: "services", title: t("Cómo trabajo", "How I work"), items: template.services.map((s) => (lang === "en" ? s.titleEn : s.title)) },
                    { key: "packages", title: t("Paquetes", "Packages"), items: template.packages.map((p) => `${p.emoji} ${lang === "en" ? p.nameEn : p.name}`) },
                    { key: "faq", title: t("Preguntas frecuentes", "FAQ"), items: template.faq.map((f) => (lang === "en" ? f.questionEn : f.question)) },
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
              <p className="mt-sp-2 text-xs text-ink/50">
                {t(
                  "También se escribe tu texto de “por qué trabajar conmigo”. Todo queda en español e inglés.",
                  "Your “why work with me” text is also written. Everything is in Spanish and English."
                )}
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-sp-4">
            <p className="text-sm text-ink/70">
              {lang === "en" ? (
                <>
                  Paste the link to your <strong>3 best videos or photos</strong> from Instagram, TikTok or Facebook (the ones you&apos;d show a brand). You
                  can leave it empty and add them later in Feed.
                </>
              ) : (
                <>
                  Pega el link de tus <strong>3 mejores videos o fotos</strong> de Instagram, TikTok o Facebook (los que mostrarías a una marca). Puedes
                  dejarlo vacío y agregarlos después en Feed.
                </>
              )}
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
                          {platform ?? t("no reconocido", "not recognized")}
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
                    <span className="text-xs font-medium text-ink">{t("Descripción corta", "Short description")}</span>
                    <input
                      value={piece.caption}
                      onChange={(e) => set("pieces", v.pieces.map((p, j) => (j === i ? { ...p, caption: e.target.value } : p)))}
                      placeholder={t("Reseña sérum de vitamina C", "Vitamin C serum review")}
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
              <span className="text-sm font-medium text-ink">{t("Correo para marcas", "Email for brands")}</span>
              <input type="email" value={v.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputClass} />
            </label>
            <div className="grid gap-sp-4 sm:grid-cols-3">
              <label className={labelClass}>
                <span className="text-sm font-medium text-ink">Instagram</span>
                <input value={v.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder={t("@tuusuario", "@yourhandle")} className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className="text-sm font-medium text-ink">TikTok</span>
                <input value={v.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder={t("@tuusuario", "@yourhandle")} className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className="text-sm font-medium text-ink">{t("WhatsApp (opcional)", "WhatsApp (optional)")}</span>
                <input value={v.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+1 809 000 0000" className={inputClass} />
              </label>
            </div>
            <div>
              <p className="mb-sp-2 text-sm font-medium text-ink">{t("El color de tu sitio", "Your site's color")}</p>
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
                    {pickLabel(lang, ACCENTS[id])}
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
            {t("← Atrás", "← Back")}
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className={primaryButtonClass}>
            {t("Siguiente →", "Next →")}
          </button>
        ) : (
          <button type="button" onClick={finish} disabled={saving} className={primaryButtonClass}>
            {saving ? t("Creando tu sitio…", "Creating your site…") : t("Crear mi sitio ✨", "Create my site ✨")}
          </button>
        )}
      </div>
    </div>
  );
}
