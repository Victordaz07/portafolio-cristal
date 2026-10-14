"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Card from "@/components/admin/Card";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";
import { TITLE_MAX, type CreatorInfo, type PrivacyLevel, type PublishStatus } from "@/lib/social/tiktok-posting";

// Pantalla de publicación según las guías de TikTok para la Content Posting API
// (developers.tiktok.com/doc/content-sharing-guidelines): cuenta de destino visible, privacidad sin valor
// por defecto, interacciones apagadas por defecto, aviso de contenido comercial, declaración de
// consentimiento antes del botón, vista previa y seguimiento del estado.

type Mode = "draft" | "direct";

const MUSIC_URL = "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en";
const BRANDED_URL = "https://www.tiktok.com/legal/page/global/bc-policy/en";
const POLL_MS = 5000;
const POLL_TRIES = 36; // ~3 minutos

const PRIVACY_TEXT: Record<PrivacyLevel, [string, string]> = {
  PUBLIC_TO_EVERYONE: ["Todo el mundo", "Everyone"],
  MUTUAL_FOLLOW_FRIENDS: ["Amigos (se siguen mutuamente)", "Friends (mutual followers)"],
  FOLLOWER_OF_CREATOR: ["Seguidores", "Followers"],
  SELF_ONLY: ["Solo yo", "Only me"],
};

const STATUS_TEXT: Record<PublishStatus, [string, string]> = {
  PROCESSING_UPLOAD: ["TikTok está recibiendo el video…", "TikTok is receiving the video…"],
  PROCESSING_DOWNLOAD: ["TikTok está descargando el video…", "TikTok is downloading the video…"],
  SEND_TO_USER_INBOX: [
    "Listo: el borrador está en tu bandeja de TikTok. Abre la app y toca la notificación para editarlo y publicarlo.",
    "Done: the draft is in your TikTok inbox. Open the app and tap the notification to edit and post it.",
  ],
  PUBLISH_COMPLETE: ["¡Publicado! Ya está en tu perfil de TikTok.", "Posted! It's on your TikTok profile."],
  FAILED: ["TikTok no pudo procesar el video.", "TikTok couldn't process the video."],
};

interface CreatorResponse {
  creator: CreatorInfo;
  privacyOptions: PrivacyLevel[];
  audited: boolean;
}

export default function TikTokPublisher({ modes }: { modes: Record<Mode, boolean> }) {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>(modes.direct ? "direct" : "draft");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState<number | null>(null);

  const [creator, setCreator] = useState<CreatorResponse | null>(null);
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [creatorLoading, setCreatorLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState<PrivacyLevel | "">("");
  const [allowComment, setAllowComment] = useState(false);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowStitch, setAllowStitch] = useState(false);
  const [commercial, setCommercial] = useState(false);
  const [yourBrand, setYourBrand] = useState(false);
  const [brandedContent, setBrandedContent] = useState(false);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ status: PublishStatus | "SENT"; failReason?: string | null } | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TikTok pide consultar la info del creador cada vez que se muestra la pantalla de publicar.
  const loadCreator = useCallback(async () => {
    setCreatorLoading(true);
    setCreatorError(null);
    try {
      const response = await fetch("/api/admin/tiktok/creator-info", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Error");
      setCreator(data);
    } catch (err) {
      setCreator(null);
      setCreatorError(err instanceof Error ? err.message : t("No se pudo consultar tu cuenta de TikTok", "Couldn't check your TikTok account"));
    } finally {
      setCreatorLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (mode === "direct") loadCreator();
  }, [mode, loadCreator]);

  useEffect(() => () => {
    if (pollRef.current) clearTimeout(pollRef.current);
  }, []);

  const info = creator?.creator;
  const maxDuration = info?.maxVideoPostDurationSec ?? null;
  const tooLong = duration != null && maxDuration != null && duration > maxDuration;
  const brandedLabel = commercial && brandedContent;
  const commercialIncomplete = commercial && !yourBrand && !brandedContent;
  // El contenido de marca no puede ser privado; sin auditoría solo existe «Solo yo», así que no se ofrece.
  const brandedBlocked = !creator?.privacyOptions.some((o) => o !== "SELF_ONLY");

  function toggleBranded(checked: boolean) {
    setBrandedContent(checked);
    if (checked && privacy === "SELF_ONLY") setPrivacy("");
  }

  const directBlocked: string | null =
    !videoUrl
      ? t("Sube el video primero", "Upload the video first")
      : !creator
        ? t("Falta consultar tu cuenta de TikTok", "Your TikTok account hasn't been checked yet")
        : tooLong
          ? t(`Tu cuenta permite videos de hasta ${maxDuration} s`, `Your account allows videos up to ${maxDuration}s`)
          : !privacy
            ? t("Elige quién puede ver el video", "Choose who can see the video")
            : commercialIncomplete
              ? t("Tienes que indicar si el video promociona tu marca, a un tercero o ambos", "You need to indicate whether the video promotes your brand, a third party, or both")
              : brandedLabel && privacy === "SELF_ONLY"
                ? t("El contenido de marca no puede ser privado", "Branded content can't be private")
                : title.length > TITLE_MAX
                  ? t("El texto es demasiado largo", "The caption is too long")
                  : null;
  const blocked = mode === "direct" ? directBlocked : !videoUrl ? t("Sube el video primero", "Upload the video first") : null;

  async function poll(publishId: string, tries = 0) {
    try {
      const response = await fetch("/api/admin/tiktok/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishId }),
      });
      const data = await response.json();
      if (response.ok && data.status) {
        setStatus({ status: data.status, failReason: data.failReason });
        if (["PUBLISH_COMPLETE", "SEND_TO_USER_INBOX", "FAILED"].includes(data.status)) return;
      }
    } catch {
      // Se reintenta en la próxima vuelta.
    }
    if (tries + 1 < POLL_TRIES) pollRef.current = setTimeout(() => poll(publishId, tries + 1), POLL_MS);
  }

  async function send() {
    if (blocked) return;
    setSending(true);
    setError(null);
    setStatus(null);
    try {
      const body =
        mode === "draft"
          ? { mode, videoUrl }
          : {
              mode,
              videoUrl,
              title,
              privacyLevel: privacy,
              allowComment,
              allowDuet,
              allowStitch,
              commercial,
              yourBrand: commercial && yourBrand,
              brandedContent: commercial && brandedContent,
              durationSec: duration,
              consent: true,
            };
      const response = await fetch("/api/admin/tiktok/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Error");
      setStatus({ status: "SENT" });
      poll(data.publishId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("No se pudo mandar a TikTok", "Couldn't send to TikTok"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-sp-5 lg:grid-cols-[1fr_320px]">
      <Card className="flex flex-col gap-sp-5">
        {modes.direct && modes.draft && (
          <div role="tablist" className="flex flex-wrap gap-sp-2">
            {(["direct", "draft"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={mode === m ? primaryButtonClass : secondaryButtonClass}
              >
                {m === "direct" ? t("Publicar directo", "Post directly") : t("Mandar como borrador", "Send as draft")}
              </button>
            ))}
          </div>
        )}

        {mode === "direct" && (
          <div className="rounded-[14px] bg-cream px-sp-4 py-sp-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55">{t("Se publicará en", "Will be posted to")}</p>
            {creatorLoading ? (
              <p className="mt-1 text-sm text-ink/60">{t("Consultando tu cuenta de TikTok…", "Checking your TikTok account…")}</p>
            ) : info ? (
              <div className="mt-sp-2 flex items-center gap-sp-3">
                {info.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={info.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="h-10 w-10 rounded-full bg-lime/40" />
                )}
                <p className="text-sm font-semibold text-ink">
                  {info.nickname ?? info.username}
                  {info.username && <span className="font-normal text-ink/60"> · @{info.username}</span>}
                </p>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-sp-3">
                <p className="text-sm font-semibold text-moss">{creatorError}</p>
                <button type="button" onClick={loadCreator} className="text-sm font-semibold text-coral hover:underline">
                  {t("Reintentar", "Retry")}
                </button>
              </div>
            )}
          </div>
        )}

        {mode === "direct" && creator && !creator.audited && (
          <p className="rounded-[14px] bg-lime/35 px-sp-4 py-sp-3 text-[13px] text-ink">
            {t(
              "Mientras TikTok no termine de revisar Foliocrew, los videos solo se pueden publicar en privado («Solo yo») y tu cuenta de TikTok tiene que estar en privado.",
              "Until TikTok finishes reviewing Foliocrew, videos can only be posted privately (“Only me”) and your TikTok account must be private."
            )}
          </p>
        )}

        <MediaUploadField label={t("Video", "Video")} kind="video" value={videoUrl} onChange={(url) => { setVideoUrl(url); setDuration(null); }} />
        {tooLong && (
          <p className="text-[13px] font-semibold text-coral">
            {t(`El video dura ${Math.round(duration ?? 0)} s y tu cuenta permite hasta ${maxDuration} s.`, `The video is ${Math.round(duration ?? 0)}s long and your account allows up to ${maxDuration}s.`)}
          </p>
        )}

        {mode === "draft" ? (
          <p className="text-[13px] text-ink/70">
            {t(
              "El video llega a la bandeja de tu app de TikTok. Ahí le agregas sonido, texto y lo publicas. TikTok permite hasta 5 borradores pendientes por día.",
              "The video arrives in your TikTok app inbox. There you add sound and text and post it. TikTok allows up to 5 pending drafts per day."
            )}
          </p>
        ) : (
          <>
            <label className={labelClass}>
              <span className="text-sm font-medium text-ink">{t("Texto del video", "Caption")}</span>
              <textarea value={title} onChange={(e) => setTitle(e.target.value)} rows={4} maxLength={TITLE_MAX} className={inputClass} />
              <span className="text-right text-[11px] text-ink/50">{title.length}/{TITLE_MAX}</span>
            </label>

            <label className={labelClass}>
              <span className="text-sm font-medium text-ink">{t("¿Quién puede ver este video?", "Who can see this video?")}</span>
              <select value={privacy} onChange={(e) => setPrivacy(e.target.value as PrivacyLevel | "")} className={inputClass} disabled={!creator}>
                <option value="" disabled>
                  {t("Elige una opción", "Choose an option")}
                </option>
                {creator?.privacyOptions.map((option) => {
                  const lockedByBrand = option === "SELF_ONLY" && brandedLabel;
                  return (
                    <option key={option} value={option} disabled={lockedByBrand}>
                      {t(...PRIVACY_TEXT[option])}
                      {lockedByBrand ? ` — ${t("no disponible con contenido de marca", "not available for branded content")}` : ""}
                    </option>
                  );
                })}
              </select>
              {brandedLabel && (
                <span className="text-[11px] text-ink/55">
                  {t("El contenido de marca no puede ser privado, por eso «Solo yo» está desactivado.", "Branded content can't be private, so “Only me” is disabled.")}
                </span>
              )}
            </label>

            <fieldset className="flex flex-col gap-sp-2">
              <legend className="mb-sp-1 text-sm font-medium text-ink">{t("Permitir que otros usuarios…", "Allow users to…")}</legend>
              {(
                [
                  ["comment", t("Comentar", "Comment"), allowComment, setAllowComment, info?.commentDisabled],
                  ["duet", "Duet", allowDuet, setAllowDuet, info?.duetDisabled],
                  ["stitch", "Stitch", allowStitch, setAllowStitch, info?.stitchDisabled],
                ] as const
              ).map(([key, label, checked, set, disabledByCreator]) => (
                <label key={key} className={`flex items-center gap-sp-2 text-sm ${disabledByCreator ? "text-ink/35" : "text-ink"}`}>
                  <input type="checkbox" checked={checked && !disabledByCreator} disabled={!!disabledByCreator || !creator} onChange={(e) => set(e.target.checked)} />
                  {label}
                  {disabledByCreator && <span className="text-[11px]">{t("(desactivado en tu cuenta de TikTok)", "(turned off in your TikTok settings)")}</span>}
                </label>
              ))}
            </fieldset>

            <fieldset className="flex flex-col gap-sp-2 rounded-[14px] border border-line p-sp-4">
              <label className="flex items-center justify-between gap-sp-3 text-sm font-medium text-ink">
                {t("Divulgar contenido comercial", "Disclose video content")}
                <input
                  type="checkbox"
                  role="switch"
                  checked={commercial}
                  onChange={(e) => {
                    setCommercial(e.target.checked);
                    if (!e.target.checked) {
                      setYourBrand(false);
                      setBrandedContent(false);
                    }
                  }}
                />
              </label>
              <p className="text-[12px] text-ink/60">
                {t(
                  "Actívalo si este video promociona tu negocio, un producto o una marca a cambio de algo.",
                  "Turn on to disclose that this video promotes goods or services in exchange for something of value."
                )}
              </p>
              {commercial && (
                <div className="mt-sp-2 flex flex-col gap-sp-2">
                  <label className="flex items-start gap-sp-2 text-sm text-ink">
                    <input type="checkbox" className="mt-1" checked={yourBrand} onChange={(e) => setYourBrand(e.target.checked)} />
                    <span>
                      {t("Tu marca", "Your brand")}
                      <span className="block text-[12px] text-ink/60">{t("Promocionas tu propio negocio o producto.", "You are promoting yourself or your own business.")}</span>
                    </span>
                  </label>
                  <label
                    className={`flex items-start gap-sp-2 text-sm ${brandedBlocked ? "text-ink/35" : "text-ink"}`}
                    title={brandedBlocked ? t("El contenido de marca no puede ser privado", "Branded content can't be private") : undefined}
                  >
                    <input type="checkbox" className="mt-1" checked={brandedContent} disabled={brandedBlocked} onChange={(e) => toggleBranded(e.target.checked)} />
                    <span>
                      {t("Contenido de marca", "Branded content")}
                      <span className="block text-[12px] text-ink/60">
                        {brandedBlocked
                          ? t("No disponible mientras solo se pueda publicar en privado.", "Not available while posts can only be private.")
                          : t("Promocionas a otra marca o a un tercero.", "You are promoting another brand or a third party.")}
                      </span>
                    </span>
                  </label>
                  {commercialIncomplete ? (
                    <p className="text-[12px] font-semibold text-coral">
                      {t("Tienes que indicar si el video promociona tu marca, a un tercero o ambos.", "You need to indicate whether the video promotes your brand, a third party, or both.")}
                    </p>
                  ) : (
                    <p className="text-[12px] text-ink/70">
                      {brandedLabel
                        ? t("Tu video se etiquetará como «Colaboración pagada».", "Your photo/video will be labeled as 'Paid partnership'")
                        : t("Tu video se etiquetará como «Contenido promocional».", "Your photo/video will be labeled as 'Promotional content'")}
                    </p>
                  )}
                </div>
              )}
            </fieldset>

            <p className="text-[12px] text-ink/70">
              {brandedLabel ? (
                <>
                  {t("Al publicar, aceptas la ", "By posting, you agree to TikTok's ")}
                  <a href={BRANDED_URL} target="_blank" rel="noreferrer" className="text-coral underline">
                    {t("Política de contenido de marca", "Branded Content Policy")}
                  </a>
                  {t(" y la ", " and ")}
                  <a href={MUSIC_URL} target="_blank" rel="noreferrer" className="text-coral underline">
                    {t("Confirmación de uso de música", "Music Usage Confirmation")}
                  </a>
                  {t(" de TikTok.", ".")}
                </>
              ) : (
                <>
                  {t("Al publicar, aceptas la ", "By posting, you agree to TikTok's ")}
                  <a href={MUSIC_URL} target="_blank" rel="noreferrer" className="text-coral underline">
                    {t("Confirmación de uso de música", "Music Usage Confirmation")}
                  </a>
                  {t(" de TikTok.", ".")}
                </>
              )}
            </p>
          </>
        )}

        <div className="flex flex-col gap-sp-2">
          <span title={blocked ?? undefined} className="w-fit">
            <button type="button" onClick={send} disabled={!!blocked || sending} className={primaryButtonClass}>
              {sending
                ? t("Enviando a TikTok…", "Sending to TikTok…")
                : mode === "direct"
                  ? t("Publicar en TikTok", "Post to TikTok")
                  : t("Mandar a TikTok como borrador", "Send to TikTok as a draft")}
            </button>
          </span>
          {blocked && !sending && <p className="text-[12px] text-ink/55">{blocked}</p>}
          {error && <p className="rounded-[14px] bg-coral/15 px-sp-4 py-sp-3 text-sm font-semibold text-moss">{error}</p>}
          {status && (
            <div className="rounded-[14px] bg-sage/30 px-sp-4 py-sp-3 text-sm text-cobalt" aria-live="polite">
              <p className="font-semibold">
                {status.status === "SENT"
                  ? t("Enviado. TikTok puede tardar unos minutos en procesar el video.", "Sent. TikTok may take a few minutes to process the video.")
                  : t(...STATUS_TEXT[status.status])}
              </p>
              {status.status === "FAILED" && status.failReason && <p className="mt-1 font-mono text-[11px]">{status.failReason}</p>}
              {mode === "direct" && status.status !== "FAILED" && status.status !== "PUBLISH_COMPLETE" && (
                <p className="mt-1 text-[12px]">
                  {t("Puede tardar unos minutos en aparecer en tu perfil.", "It may take a few minutes to appear on your profile.")}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="flex h-fit flex-col gap-sp-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55">{t("Vista previa", "Preview")}</p>
        {videoUrl ? (
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            playsInline
            onLoadedMetadata={(e) => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : null)}
            className="aspect-[9/16] w-full rounded-[14px] bg-ink object-contain"
          />
        ) : (
          <div className="flex aspect-[9/16] w-full items-center justify-center rounded-[14px] bg-cream text-[13px] text-ink/50">
            {t("Aquí verás tu video", "Your video will show here")}
          </div>
        )}
        {mode === "direct" && title && <p className="whitespace-pre-wrap break-words text-[13px] text-ink/80">{title}</p>}
      </Card>
    </div>
  );
}
