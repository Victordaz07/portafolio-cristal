"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { MAX_MESSAGE, MAX_TRIGGERS, normalizeKeyword } from "@/lib/comment-trigger";

interface Rule {
  id: string;
  mediaId: string;
  mediaLabel: string;
  keyword: string;
  message: string;
  active: boolean;
  sent: number;
  waiting: number;
  failed: number;
}
interface Media {
  id: string;
  title: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
}

/** Lista de reglas «comenta una palabra → DM» y formulario para crear una. */
export default function CommentTriggerManager({ rules, connected }: { rules: Rule[]; connected: boolean }) {
  const { t } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [media, setMedia] = useState<Media[] | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaId, setMediaId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");

  async function loadMedia() {
    setLoadingMedia(true);
    const response = await fetch("/api/admin/comment-triggers/media");
    const data = (await response.json().catch(() => ({}))) as { items?: Media[]; error?: string };
    setLoadingMedia(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudieron traer tus publicaciones", "Couldn't load your posts"));
    setMedia(data.items ?? []);
  }

  async function call(url: string, method: string, body?: object, ok?: string) {
    setBusy(true);
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
      return false;
    }
    if (ok) showToast("success", ok);
    router.refresh();
    return true;
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const chosen = media?.find((m) => m.id === mediaId);
    const saved = await call("/api/admin/comment-triggers", "POST", { mediaId, mediaLabel: (chosen?.title ?? "").slice(0, 120), keyword, message }, t("Regla creada", "Rule created"));
    if (saved) {
      setKeyword("");
      setMessage("");
    }
  }

  const label = "flex flex-col gap-sp-1 text-xs font-medium text-ink";
  return (
    <>
      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Nueva regla", "New rule")}</p>
        {!connected ? (
          <p className="text-sm text-ink/60">{t("Conecta Instagram para crear reglas.", "Connect Instagram to create rules.")}</p>
        ) : rules.length >= MAX_TRIGGERS ? (
          <p className="text-sm text-ink/60">{t(`Llegaste al máximo de ${MAX_TRIGGERS} reglas. Borra alguna para crear otra.`, `You've reached the maximum of ${MAX_TRIGGERS} rules. Delete one to create another.`)}</p>
        ) : (
          <form onSubmit={create} className="flex flex-col gap-sp-3">
            {media === null ? (
              <button type="button" onClick={loadMedia} disabled={loadingMedia} className={`${secondaryButtonClass} self-start`}>
                {loadingMedia ? t("Cargando…", "Loading…") : t("1. Elegir publicación", "1. Choose a post")}
              </button>
            ) : media.length === 0 ? (
              <p className="text-sm text-ink/60">{t("No encontramos publicaciones recientes.", "We couldn't find recent posts.")}</p>
            ) : (
              <fieldset className="flex flex-col gap-sp-2">
                <legend className="mb-1 text-xs font-medium text-ink">{t("Publicación", "Post")}</legend>
                <div className="grid gap-sp-2 sm:grid-cols-2">
                  {media.map((m) => (
                    <label key={m.id} className={`flex cursor-pointer items-center gap-sp-3 rounded-[12px] border p-sp-2 text-xs ${mediaId === m.id ? "border-coral bg-coral/5" : "border-line"}`}>
                      <input type="radio" name="media" value={m.id} checked={mediaId === m.id} onChange={() => setMediaId(m.id)} className="sr-only" />
                      {m.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.thumbnailUrl} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" loading="lazy" />
                      ) : (
                        <span className="h-12 w-12 shrink-0 rounded-md bg-cream" />
                      )}
                      <span className="line-clamp-2 text-ink">{m.title || t("(sin texto)", "(no caption)")}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <label className={label}>
              {t("Palabra que activa el mensaje", "Word that triggers the message")}
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} maxLength={30} placeholder="LINK" className={`${inputClass} sm:w-60`} />
              {keyword && (
                <span className="font-normal text-ink/50">
                  {t("Se buscará:", "We'll look for:")} «{normalizeKeyword(keyword)}» ({t("sin importar mayúsculas ni acentos", "ignoring case and accents")})
                </span>
              )}
            </label>
            <label className={label}>
              {t("Mensaje que se envía por DM", "Message sent by DM")}
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={MAX_MESSAGE} placeholder={t("¡Hola {nombre}! Aquí tienes el enlace: https://…", "Hi {name}! Here's the link: https://…")} className={inputClass} />
              <span className="font-normal text-ink/50">
                {message.length}/{MAX_MESSAGE} · {t("Puedes usar {nombre} para poner su usuario.", "You can use {name} to insert their username.")}
              </span>
            </label>
            <button type="submit" disabled={busy || !mediaId || !normalizeKeyword(keyword) || !message.trim()} className={`${primaryButtonClass} self-start`}>
              {t("Crear regla", "Create rule")}
            </button>
          </form>
        )}
      </Card>

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Tus reglas", "Your rules")}</p>
        {rules.length === 0 ? (
          <p className="text-sm text-ink/60">{t("Todavía no tienes reglas.", "You don't have any rules yet.")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {rules.map((r) => (
              <li key={r.id} className="flex flex-col gap-sp-2 py-sp-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-sp-2">
                  <p className="text-ink">
                    <span className="rounded-full bg-lime/40 px-sp-3 py-0.5 font-mono text-xs">{r.keyword}</span>{" "}
                    <span className="text-ink/60">{r.mediaLabel ? `→ ${r.mediaLabel.slice(0, 60)}` : `→ ${r.mediaId}`}</span>
                  </p>
                  <span className="flex items-center gap-sp-3 text-xs">
                    <button type="button" disabled={busy} onClick={() => call(`/api/admin/comment-triggers/${r.id}`, "PATCH", { active: !r.active })} className="font-semibold text-coral hover:underline">
                      {r.active ? t("Pausar", "Pause") : t("Activar", "Activate")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => window.confirm(t("¿Borrar esta regla?", "Delete this rule?")) && call(`/api/admin/comment-triggers/${r.id}`, "DELETE")}
                      className="text-red-600/70 hover:text-red-600"
                    >
                      {t("Borrar", "Delete")}
                    </button>
                  </span>
                </div>
                <p className="whitespace-pre-line rounded-[10px] bg-cream px-sp-3 py-sp-2 text-xs text-ink/80">{r.message}</p>
                <p className="text-xs text-ink/50">
                  {r.active ? t("Activa", "Active") : t("En pausa", "Paused")} · {t(`${r.sent} enviados`, `${r.sent} sent`)}
                  {r.waiting > 0 && ` · ${t(`${r.waiting} sin enviar (permiso pendiente o tope diario)`, `${r.waiting} not sent (pending permission or daily cap)`)}`}
                  {r.failed > 0 && ` · ${t(`${r.failed} con error`, `${r.failed} failed`)}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
