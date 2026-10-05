"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import {
  CONTENT_TYPES,
  contentTypeLabel,
  NETWORK_META,
  PLAN_NETWORKS,
  isPlanNetwork,
  planWarnings,
  previewAspect,
  type ContentType,
  type PlanNetwork,
} from "@/lib/content-plan";
import type { PostView } from "@/lib/posts-view";
import { useT } from "@/components/admin/AdminLang";

const eyebrowClass = "font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55";
const TIPS_DEBOUNCE_MS = 2000;
const TIPS_MIN_CHARS = 20;

type Tips = { network: PlanNetwork; tips: string[] }[];

function Chip({
  active,
  onClick,
  children,
  activeClass = "border-ink bg-ink text-cream",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
        active ? activeClass : "border-line bg-white text-ink/70 hover:border-coral"
      }`}
    >
      {children}
    </button>
  );
}

export default function Composer({
  brands,
  dealBrandIds,
  initial,
  defaultDate,
  aiConfigured,
  timeZone,
}: {
  brands: { id: string; name: string }[];
  dealBrandIds: string[];
  initial: PostView | null;
  defaultDate: string;
  aiConfigured: boolean;
  timeZone: string;
}) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [contentType, setContentType] = useState<ContentType>((initial?.contentType as ContentType) ?? "reel");
  const [networks, setNetworks] = useState<PlanNetwork[]>(
    initial ? initial.networks.filter(isPlanNetwork) : ["instagram", "tiktok"]
  );
  const [brandId, setBrandId] = useState<string | null>(initial?.brandId ?? null);
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [mediaType, setMediaType] = useState<"image" | "video">((initial?.mediaType as "image" | "video") ?? "video");
  const [mediaUrl, setMediaUrl] = useState(initial?.mediaUrl ?? "");
  const [date, setDate] = useState(initial?.dateKey ?? defaultDate);
  const [time, setTime] = useState(initial?.time ?? "18:00");
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tips, setTips] = useState<Tips>([]);
  const [tipsState, setTipsState] = useState<"idle" | "loading" | "error">("idle");
  const [tipsError, setTipsError] = useState("");
  const lastAnalyzed = useRef("");

  const brandName = brands.find((b) => b.id === brandId)?.name ?? null;
  const warnings = planWarnings(caption, contentType, networks, lang);
  const dealBrands = brands.filter((b) => dealBrandIds.includes(b.id));
  const otherBrands = brands.filter((b) => !dealBrandIds.includes(b.id));

  function toggleNetwork(network: PlanNetwork) {
    setNetworks((current) => (current.includes(network) ? current.filter((n) => n !== network) : [...current, network]));
  }

  async function suggestCaption() {
    setSuggesting(true);
    try {
      const response = await fetch("/api/admin/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, contentType, networks, brandName, draft: caption || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t("No se pudo sugerir", "Couldn't suggest"));
      setSuggestions(data.captions ?? []);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : t("No se pudo sugerir", "Couldn't suggest"));
    } finally {
      setSuggesting(false);
    }
  }

  async function analyze(force = false) {
    const key = `${contentType}|${networks.join(",")}|${caption.trim()}`;
    if (!force && key === lastAnalyzed.current) return;
    lastAnalyzed.current = key;
    setTipsState("loading");
    try {
      const response = await fetch("/api/admin/ai/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, contentType, networks }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t("No se pudo analizar", "Couldn't analyze"));
      setTips(data.tips ?? []);
      setTipsState("idle");
    } catch (error) {
      setTipsError(error instanceof Error ? error.message : t("No se pudo analizar", "Couldn't analyze"));
      setTipsState("error");
    }
  }

  // Consejos por red: se piden solos cuando dejas de escribir (con pausa, para no gastar de más).
  useEffect(() => {
    if (!aiConfigured || caption.trim().length < TIPS_MIN_CHARS || networks.length === 0) return;
    const timer = setTimeout(() => analyze(), TIPS_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caption, contentType, networks, aiConfigured]);

  async function save(status: "draft" | "scheduled") {
    if (networks.length === 0) return showToast("error", t("Elige al menos una red", "Pick at least one network"));
    if (!date || !time) return showToast("error", t("Falta la fecha o la hora", "Date or time is missing"));
    setSaving(true);
    const body = {
      caption,
      topic: topic || null,
      contentType,
      networks,
      brandId,
      mediaUrl: mediaUrl || null,
      mediaType: mediaUrl ? mediaType : null,
      date,
      time,
      status,
    };
    const response = await fetch(initial ? `/api/admin/posts/${initial.id}` : "/api/admin/posts", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", status === "draft" ? t("Borrador guardado", "Draft saved") : t("¡Publicación programada!", "Post scheduled!"));
    router.push(`/admin/calendario?month=${date.slice(0, 7)}`);
    router.refresh();
  }

  return (
    <div className="grid items-start gap-sp-4 xl:grid-cols-[1.35fr_1fr]">
      <Card className="flex flex-col gap-sp-5 p-sp-5 sm:p-sp-6">
        <div>
          <p className={eyebrowClass}>{t("Tipo de publicación", "Post type")}</p>
          <div className="mt-sp-2 flex flex-wrap gap-sp-2">
            {CONTENT_TYPES.map((type) => (
              <Chip key={type} active={contentType === type} onClick={() => setContentType(type)}>
                {contentTypeLabel(type, lang)}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className={eyebrowClass}>{t("Publicar en", "Post to")}</p>
          <div className="mt-sp-2 flex flex-wrap gap-sp-2">
            {PLAN_NETWORKS.map((network) => (
              <Chip
                key={network}
                active={networks.includes(network)}
                onClick={() => toggleNetwork(network)}
                activeClass={`border-transparent ${NETWORK_META[network].badge}`}
              >
                {NETWORK_META[network].label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className={eyebrowClass}>{t("¿Es para una marca?", "Is it for a brand?")}</p>
          <div className="mt-sp-2 flex flex-wrap items-center gap-sp-2">
            <Chip active={brandId === null} onClick={() => setBrandId(null)}>
              {t("Ninguna", "None")}
            </Chip>
            {dealBrands.map((brand) => (
              <Chip key={brand.id} active={brandId === brand.id} onClick={() => setBrandId(brand.id)}>
                {brand.name}
              </Chip>
            ))}
            {otherBrands.length > 0 && (
              <select
                value={otherBrands.some((b) => b.id === brandId) ? brandId ?? "" : ""}
                onChange={(e) => setBrandId(e.target.value || null)}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink/70"
                aria-label={t("Otra marca", "Other brand")}
              >
                <option value="">{t("Otra marca…", "Other brand…")}</option>
                {otherBrands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <label className="flex flex-col gap-sp-2">
          <span className={eyebrowClass}>{t("Tema (para la sugerencia de IA)", "Topic (for the AI suggestion)")}</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={inputClass}
            placeholder={t("Ej: rutina de skincare de noche con Sol Skincare", "E.g.: night skincare routine with Sol Skincare")}
          />
        </label>

        <div className="flex flex-col gap-sp-2">
          <div className="flex items-center justify-between gap-sp-3">
            <span className={eyebrowClass}>Caption</span>
            <button
              type="button"
              onClick={suggestCaption}
              disabled={!aiConfigured || suggesting}
              title={aiConfigured ? undefined : t("Configura ANTHROPIC_API_KEY en Conectar cuentas", "Set ANTHROPIC_API_KEY in Connect accounts")}
              className="rounded-full bg-lime px-sp-3 py-1 text-xs font-bold text-ink transition hover:bg-lime/80 disabled:opacity-50"
            >
              {suggesting ? t("Pensando…", "Thinking…") : t("✦ Sugerir con IA", "✦ Suggest with AI")}
            </button>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={6}
            className={`${inputClass} resize-y`}
            placeholder={t("Escribe tu caption o pide una sugerencia con IA…", "Write your caption or ask the AI for a suggestion…")}
          />
          <div className="flex flex-wrap gap-sp-3 text-[11px] text-ink/50">
            {networks.map((network) => {
              const limit = NETWORK_META[network].captionLimit;
              return (
                <span key={network} className={caption.length > limit ? "font-bold text-coral" : ""}>
                  {NETWORK_META[network].initials} {caption.length}/{limit}
                </span>
              );
            })}
          </div>
          {!aiConfigured && (
            <p className="text-xs text-ink/50">
              {t("Para usar la IA agrega", "To use AI, add")} <code className="font-mono">ANTHROPIC_API_KEY</code>{" "}
              {t("(ver Negocio → Conectar cuentas).", "(see Business → Connect accounts).")}
            </p>
          )}
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-sp-2 rounded-[14px] bg-lime/20 p-sp-3">
              <p className={eyebrowClass}>{t("Sugerencias de la IA · toca una para usarla", "AI suggestions · tap one to use it")}</p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setCaption(suggestion);
                    setSuggestions([]);
                  }}
                  className="whitespace-pre-line rounded-[10px] border border-line bg-white p-sp-3 text-left text-[13px] text-ink transition hover:border-coral"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-sp-2">
          <div className="flex items-center justify-between gap-sp-3">
            <span className={eyebrowClass}>{t("Foto o video (opcional)", "Photo or video (optional)")}</span>
            <div className="flex gap-1">
              {(["video", "image"] as const).map((type) => (
                <Chip
                  key={type}
                  active={mediaType === type}
                  onClick={() => {
                    if (type !== mediaType) setMediaUrl("");
                    setMediaType(type);
                  }}
                >
                  {type === "video" ? "Video" : t("Foto", "Photo")}
                </Chip>
              ))}
            </div>
          </div>
          <MediaUploadField
            key={mediaType}
            label={mediaType === "video" ? t("Sube el video", "Upload the video") : t("Sube la foto", "Upload the photo")}
            value={mediaUrl}
            onChange={setMediaUrl}
            kind={mediaType === "video" ? "video" : "photo"}
            aspect={mediaType === "video" ? undefined : 4 / 5}
            recommendedSize={mediaType === "video" ? t("1080 × 1920 px (vertical, 9:16)", "1080 × 1920 px (portrait, 9:16)") : "1080 × 1350 px"}
          />
        </div>

        {warnings.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-[12px] bg-coral/10 px-sp-4 py-sp-3 text-[13px] text-moss">
            {warnings.map((warning) => (
              <li key={warning}>⚠ {warning}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-sp-3 border-t border-line pt-sp-4">
          <div className="grid gap-sp-3 sm:grid-cols-2">
            <label className="flex flex-col gap-sp-1">
              <span className={eyebrowClass}>{t("Día", "Day")}</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-sp-1">
              <span className={eyebrowClass}>
                {t("Hora", "Time")} ({timeZone.replace("_", " ")})
              </span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
            </label>
          </div>
          <div className="flex flex-wrap gap-sp-3">
            <button type="button" onClick={() => save("scheduled")} disabled={saving} className={primaryButtonClass}>
              {saving
                ? t("Guardando…", "Saving…")
                : initial
                  ? t("Guardar y programar", "Save and schedule")
                  : networks.length === 1
                    ? t(`Programar en ${NETWORK_META[networks[0]].label}`, `Schedule on ${NETWORK_META[networks[0]].label}`)
                    : t("Programar en todas", "Schedule on all")}
            </button>
            <button type="button" onClick={() => save("draft")} disabled={saving} className={secondaryButtonClass}>
              {t("Guardar borrador", "Save draft")}
            </button>
          </div>
          <p className="text-[11px] text-ink/45">
            {t(
              "Por ahora no se publica sola: el día programado aparece en tu Calendario y en el Resumen para que la subas y la marques como publicada. La publicación automática llega cuando las redes aprueben la app.",
              "For now it doesn't post on its own: on the scheduled day it shows up in your Calendar and Overview so you can upload it and mark it as published. Automatic publishing arrives once the networks approve the app."
            )}
          </p>
        </div>
      </Card>

      <div className="flex flex-col gap-sp-4 xl:sticky xl:top-sp-5">
        <Card>
          <p className={`${eyebrowClass} mb-sp-3`}>{t("Vista previa en vivo", "Live preview")}</p>
          {networks.length === 0 ? (
            <p className="text-sm text-ink/60">{t("Elige una red para ver la vista previa.", "Pick a network to see the preview.")}</p>
          ) : (
            <div className="-mx-1 flex gap-sp-3 overflow-x-auto px-1 pb-sp-2">
              {networks.map((network) => {
                const meta = NETWORK_META[network];
                const short = caption.length > meta.previewChars ? `${caption.slice(0, meta.previewChars)}… ${t("más", "more")}` : caption;
                return (
                  <div key={network} className="w-[180px] shrink-0 overflow-hidden rounded-[14px] border border-line bg-white">
                    <div className="flex items-center gap-sp-2 px-2.5 py-sp-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[8px] font-bold ${meta.badge}`}>
                        {meta.initials}
                      </span>
                      <span className="text-[11px] font-semibold text-ink">{meta.label}</span>
                    </div>
                    <div
                      className="flex items-center justify-center bg-cream text-[11px] text-ink/40"
                      style={{ aspectRatio: previewAspect(network, contentType) }}
                    >
                      {mediaUrl ? (
                        mediaType === "video" ? (
                          <video src={mediaUrl} muted playsInline className="h-full w-full object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
                        )
                      ) : (
                        t("Tu foto o video", "Your photo or video")
                      )}
                    </div>
                    <p className="whitespace-pre-line break-words px-2.5 py-sp-2 text-[11px] leading-snug text-ink/80">
                      {short || <span className="text-ink/35">{t("Aquí se verá tu caption", "Your caption will show here")}</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="rounded-[18px] bg-ink p-sp-5 text-cream">
          <div className="flex items-center justify-between gap-sp-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-lime">{t("Cómo ejecutarlo en cada red", "How to nail it on each network")}</p>
            {aiConfigured && caption.trim().length >= TIPS_MIN_CHARS && networks.length > 0 && (
              <button type="button" onClick={() => analyze(true)} className="text-[11px] text-cream/60 hover:text-cream">
                {t("↻ Actualizar", "↻ Refresh")}
              </button>
            )}
          </div>
          <div className="mt-sp-3 text-[13px]">
            {!aiConfigured ? (
              <p className="text-cream/60">{t("Configura la IA en Conectar cuentas para recibir consejos por red.", "Set up AI in Connect accounts to get tips per network.")}</p>
            ) : caption.trim().length < TIPS_MIN_CHARS ? (
              <p className="text-cream/60">
                {t(`Escribe al menos ${TIPS_MIN_CHARS} caracteres de caption para recibir sugerencias.`, `Write at least ${TIPS_MIN_CHARS} caption characters to get suggestions.`)}
              </p>
            ) : tipsState === "loading" ? (
              <p className="text-cream/60">{t("Analizando tu publicación…", "Analyzing your post…")}</p>
            ) : tipsState === "error" ? (
              <p className="text-lime">{tipsError}</p>
            ) : tips.length === 0 ? (
              <p className="text-cream/60">{t("Las sugerencias aparecen cuando dejas de escribir.", "Suggestions appear when you stop typing.")}</p>
            ) : (
              <div className="flex flex-col gap-sp-4">
                {tips
                  .filter((x) => networks.includes(x.network))
                  .map((x) => (
                    <div key={x.network}>
                      <p className="mb-1 flex items-center gap-sp-2 text-xs font-bold">
                        <span className={`h-2 w-2 rounded-full ${NETWORK_META[x.network].dot} ring-1 ring-cream/40`} />
                        {NETWORK_META[x.network].label}
                      </p>
                      <ul className="flex flex-col gap-1 text-cream/80">
                        {x.tips.map((tip) => (
                          <li key={tip}>· {tip}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
