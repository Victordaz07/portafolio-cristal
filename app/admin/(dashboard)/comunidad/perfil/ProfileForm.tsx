"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/admin-ui";
import { pickLabel } from "@/lib/admin-lang";
import { NICHES } from "@/lib/onboarding";
import { COMMUNITY_RULES, CREATOR_TYPES } from "@/lib/community";

interface Values {
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  city: string;
  showCity: boolean;
  showSite: boolean;
  creatorTypes: string[];
  niche: string;
  languages: ("es" | "en")[];
  openToCollab: boolean;
  emailNotify: boolean;
}

const chip = (on: boolean) =>
  `rounded-full border px-sp-3 py-1.5 text-sm transition ${on ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink/75 hover:border-coral"}`;

export default function ProfileForm({ initial, firstTime }: { initial: Values; firstTime: boolean }) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [v, setV] = useState<Values>(initial);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setV((c) => ({ ...c, [key]: value }));
  const toggle = <T extends string>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (firstTime && !accepted) return showToast("error", t("Para entrar, acepta las reglas de la comunidad", "To come in, accept the community rules"));
    setSaving(true);
    const response = await fetch("/api/admin/community/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...v, acceptRules: firstTime ? accepted : undefined }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", firstTime ? t("¡Listo! Ya eres parte de la comunidad", "Done! You're now part of the community") : t("Perfil guardado", "Profile saved"));
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-sp-4">
      <Card className="flex flex-col gap-sp-4">
        <div className="grid gap-sp-4 sm:grid-cols-[150px_1fr]">
          <ImageUploadField
            label={t("Foto", "Photo")}
            value={v.avatarUrl}
            onChange={(url) => set("avatarUrl", url)}
            aspect={1}
            recommendedSize="600 × 600 px"
          />
          <div className="flex flex-col gap-sp-4">
            <label className={labelClass}>
              <span className="text-sm font-medium text-ink">{t("Nombre", "Name")}</span>
              <input required minLength={2} maxLength={60} value={v.displayName} onChange={(e) => set("displayName", e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span className="text-sm font-medium text-ink">{t("Qué haces, en una frase", "What you do, in one sentence")}</span>
              <input
                maxLength={120}
                value={v.headline}
                onChange={(e) => set("headline", e.target.value)}
                placeholder={t("Ej.: Creo videos de cocina saludable en TikTok", "E.g.: I make healthy cooking videos on TikTok")}
                className={inputClass}
              />
            </label>
          </div>
        </div>
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">{t("Sobre ti (opcional)", "About you (optional)")}</span>
          <textarea rows={3} maxLength={600} value={v.bio} onChange={(e) => set("bio", e.target.value)} className={inputClass} />
        </label>
      </Card>

      <Card className="flex flex-col gap-sp-4">
        <div>
          <p className="text-sm font-medium text-ink">{t("¿Qué tipo de creador eres?", "What kind of creator are you?")}</p>
          <p className="mb-sp-2 text-xs text-ink/55">{t("Elige todos los que apliquen.", "Pick all that apply.")}</p>
          <div className="flex flex-wrap gap-sp-2">
            {CREATOR_TYPES.map((ct) => (
              <button
                key={ct.id}
                type="button"
                aria-pressed={v.creatorTypes.includes(ct.id)}
                onClick={() => set("creatorTypes", toggle(v.creatorTypes, ct.id))}
                className={chip(v.creatorTypes.includes(ct.id))}
              >
                {pickLabel(lang, ct)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-sp-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className="text-sm font-medium text-ink">{t("Tu nicho", "Your niche")}</span>
            <select value={v.niche} onChange={(e) => set("niche", e.target.value)} className={inputClass}>
              <option value="">{t("Sin elegir", "Not set")}</option>
              {NICHES.map((n) => (
                <option key={n.id} value={n.id}>
                  {pickLabel(lang, n)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className="text-sm font-medium text-ink">{t("Ciudad / país", "City / country")}</span>
            <input maxLength={80} value={v.city} onChange={(e) => set("city", e.target.value)} className={inputClass} />
          </label>
        </div>
        <div>
          <p className="mb-sp-2 text-sm font-medium text-ink">{t("Idiomas en los que creas", "Languages you create in")}</p>
          <div className="flex gap-sp-2">
            {(["es", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={v.languages.includes(l)}
                onClick={() => {
                  const next = toggle(v.languages, l);
                  if (next.length) set("languages", next);
                }}
                className={chip(v.languages.includes(l))}
              >
                {l === "es" ? t("Español", "Spanish") : t("Inglés", "English")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-sp-3 text-sm text-ink">
        <Check checked={v.openToCollab} onChange={(c) => set("openToCollab", c)}>
          {t("Me interesa colaborar con otros creadores", "I'm open to collaborating with other creators")}
        </Check>
        <Check checked={v.showCity} onChange={(c) => set("showCity", c)}>
          {t("Mostrar mi ciudad en el perfil", "Show my city on my profile")}
        </Check>
        <Check checked={v.showSite} onChange={(c) => set("showSite", c)}>
          {t("Mostrar el enlace a mi sitio de Foliocrew", "Show the link to my Foliocrew site")}
        </Check>
        <Check checked={v.emailNotify} onChange={(c) => set("emailNotify", c)}>
          {t("Avisarme por correo cuando respondan mis publicaciones", "Email me when someone replies to my posts")}
        </Check>
        <p className="text-xs text-ink/50">
          {t("Tu correo nunca se muestra en la comunidad. La comunidad solo la ven cuentas de Foliocrew.", "Your email is never shown in the community. Only Foliocrew accounts can see the community.")}
        </p>
      </Card>

      {firstTime && (
        <Card className="flex flex-col gap-sp-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Reglas de la comunidad", "Community rules")}</p>
          <ol className="flex list-decimal flex-col gap-1 pl-sp-5 text-sm text-ink/80">
            {COMMUNITY_RULES.map((r) => (
              <li key={r.es}>{lang === "en" ? r.en : r.es}</li>
            ))}
          </ol>
          <Check checked={accepted} onChange={setAccepted}>
            <strong>{t("Acepto las reglas de la comunidad", "I accept the community rules")}</strong>
          </Check>
        </Card>
      )}

      <button type="submit" disabled={saving || (firstTime && !accepted)} className={`${primaryButtonClass} self-start`}>
        {saving ? t("Guardando…", "Saving…") : firstTime ? t("Acepto y entro ✨", "Accept and come in ✨") : t("Guardar perfil", "Save profile")}
      </button>
    </form>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-sp-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1" />
      <span>{children}</span>
    </label>
  );
}
