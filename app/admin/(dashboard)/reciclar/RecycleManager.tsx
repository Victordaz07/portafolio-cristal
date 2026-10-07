"use client";

import { useState } from "react";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { RECYCLE_TONES, SOURCE_MAX, SOURCE_MIN, bankDrafts, type RecycleResult } from "@/lib/recycle";

const label = "flex flex-col gap-sp-1 text-xs font-medium text-ink";
const eyebrow = "mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral";
const TONE_LABEL = { cercano: ["Cercano", "Friendly"], profesional: ["Profesional", "Professional"], directo: ["Directo", "Direct"] } as const;

export default function RecycleManager({ aiConfigured, cards }: { aiConfigured: boolean; cards: { id: string; label: string }[] }) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [cardId, setCardId] = useState("");
  const [tone, setTone] = useState<(typeof RECYCLE_TONES)[number]>("cercano");
  const [outLang, setOutLang] = useState<"es" | "en">(lang === "en" ? "en" : "es");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RecycleResult | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    setSaved(new Set());
    const response = await fetch("/api/admin/recycle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text || undefined, cardId: cardId || undefined, tone, lang: outLang, goal: goal || undefined }) });
    const data = (await response.json().catch(() => ({}))) as RecycleResult & { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo generar", "Couldn't generate"));
    setResult(data);
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast("success", t("Copiado", "Copied"));
    } catch {
      showToast("error", t("No se pudo copiar", "Couldn't copy"));
    }
  }

  const drafts = result ? bankDrafts(result) : [];
  async function saveDraft(index: number) {
    const d = drafts[index];
    const response = await fetch("/api/admin/wellbeing/bank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: d.title, caption: d.caption, contentType: d.contentType, networks: d.networks }) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    setSaved((s) => new Set(s).add(index));
    showToast("success", t("Guardado en tu banco de contenido", "Saved to your content bank"));
  }
  const saveBtn = (index: number) => (
    <button type="button" onClick={() => saveDraft(index)} disabled={saved.has(index)} className="text-xs font-semibold text-coral hover:underline disabled:text-ink/40 disabled:no-underline">
      {saved.has(index) ? t("Guardado ✓", "Saved ✓") : t("Guardar en el banco", "Save to the bank")}
    </button>
  );
  const indexOfNetwork = (network: string, type?: string) => drafts.findIndex((d) => d.networks[0] === network && (!type || d.contentType === type));

  const Block = ({ title, body, bankIndex }: { title: string; body: string; bankIndex: number }) => (
    <Card>
      <div className="mb-sp-2 flex items-center justify-between gap-sp-2">
        <p className={eyebrow}>{title}</p>
        <span className="flex gap-sp-3">
          <button type="button" onClick={() => copy(body)} className="text-xs font-semibold text-cobalt hover:underline">{t("Copiar", "Copy")}</button>
          {bankIndex >= 0 && saveBtn(bankIndex)}
        </span>
      </div>
      <p className="whitespace-pre-line text-sm text-ink">{body}</p>
    </Card>
  );

  return (
    <>
      {!aiConfigured && <p className="rounded-[14px] border border-coral/40 bg-coral/5 px-sp-4 py-sp-3 text-sm text-ink">{t("Falta conectar la IA (Conectar cuentas → IA) para usar esta función.", "AI isn't connected yet (Connect accounts → AI) to use this feature.")}</p>}
      <Card>
        <form onSubmit={generate} className="grid gap-sp-3 sm:grid-cols-2">
          <label className={`${label} sm:col-span-2`}>
            {t("Texto original (transcripción, guion o publicación)", "Original text (transcript, script or post)")}
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} maxLength={SOURCE_MAX * 2} className={inputClass} placeholder={t("Pega aquí el texto de tu video largo…", "Paste the text of your long video here…")} />
            <span className="font-normal text-ink/50">{text.length.toLocaleString("en-US")} / {SOURCE_MAX.toLocaleString("en-US")} {t("caracteres (si pasa, se usa el principio)", "characters (if it goes over, the beginning is used)")}</span>
          </label>
          <label className={`${label} sm:col-span-2`}>
            {t("…o una publicación tuya que funcionó (opcional)", "…or one of your posts that worked (optional)")}
            <select value={cardId} onChange={(e) => setCardId(e.target.value)} className={inputClass}>
              <option value="">{t("— ninguna —", "— none —")}</option>
              {cards.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label className={label}>{t("Tono", "Tone")}
            <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className={inputClass}>
              {RECYCLE_TONES.map((x) => <option key={x} value={x}>{TONE_LABEL[x][lang === "en" ? 1 : 0]}</option>)}
            </select>
          </label>
          <label className={label}>{t("Idioma del resultado", "Output language")}
            <select value={outLang} onChange={(e) => setOutLang(e.target.value as "es" | "en")} className={inputClass}>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className={`${label} sm:col-span-2`}>{t("Objetivo (opcional)", "Goal (optional)")}<input maxLength={200} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={t("Ej.: conseguir seguidores nuevos", "E.g.: get new followers")} className={inputClass} /></label>
          <div className="flex items-center gap-sp-3 sm:col-span-2">
            <button type="submit" disabled={busy || !aiConfigured || (text.trim().length < SOURCE_MIN && !cardId)} className={primaryButtonClass}>{busy ? t("Reciclando…", "Recycling…") : t("Reciclar contenido", "Recycle content")}</button>
            <span className="text-xs text-ink/50">{t("Cuenta como 1 sugerencia de IA de tu plan.", "Counts as 1 AI suggestion from your plan.")}</span>
          </div>
        </form>
      </Card>

      {result && (
        <div className="grid gap-sp-3 lg:grid-cols-2">
          <Card>
            <div className="mb-sp-2 flex items-center justify-between"><p className={eyebrow}>{t("Ganchos", "Hooks")}</p></div>
            <ul className="flex flex-col gap-sp-2">
              {result.hooks.map((h) => (
                <li key={h} className="flex items-start justify-between gap-sp-2 text-sm text-ink">
                  <span>{h}</span>
                  <button type="button" onClick={() => copy(h)} className="shrink-0 text-xs font-semibold text-cobalt hover:underline">{t("Copiar", "Copy")}</button>
                </li>
              ))}
            </ul>
          </Card>
          {result.instagram.caption && <Block title="Instagram" body={[result.instagram.caption, result.instagram.hashtags.join(" ")].filter(Boolean).join("\n\n")} bankIndex={indexOfNetwork("instagram", "reel")} />}
          {result.tiktok.caption && <Block title="TikTok" body={`${result.tiktok.caption}\n\n${t("En pantalla:", "On screen:")} ${result.tiktok.onScreenText}`} bankIndex={indexOfNetwork("tiktok")} />}
          {result.youtube.title && <Block title="YouTube" body={`${result.youtube.title}\n\n${result.youtube.description}`} bankIndex={indexOfNetwork("youtube")} />}
          {result.facebook.post && <Block title="Facebook" body={result.facebook.post} bankIndex={indexOfNetwork("facebook")} />}
          {result.carousel.slides.length > 0 && <Block title={t("Carrusel", "Carousel")} body={result.carousel.slides.map((s, i) => `${i + 1}. ${s.title}${s.text ? `\n   ${s.text}` : ""}`).join("\n")} bankIndex={indexOfNetwork("instagram", "carousel")} />}
          <p className="text-xs text-ink/55 lg:col-span-2">
            {t("Revisa todo antes de publicar. Si es para una marca, añade el aviso de publicidad (#publicidad / #ad). Foliocrew no publica nada por su cuenta.", "Review everything before publishing. If it's for a brand, add the ad disclosure (#ad). Foliocrew doesn't publish anything on its own.")}{" "}
            <button type="button" onClick={() => setResult(null)} className={`${secondaryButtonClass} !px-sp-3 !py-1 text-xs`}>{t("Limpiar", "Clear")}</button>
          </p>
        </div>
      )}
    </>
  );
}
