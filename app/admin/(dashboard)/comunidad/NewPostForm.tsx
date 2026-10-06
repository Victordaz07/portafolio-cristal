"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { pickLabel } from "@/lib/admin-lang";
import { CREATOR_TYPES, LIMITS, POST_KINDS, TOPICS, type PostKind } from "@/lib/community";

const EMPTY = { kind: "pregunta" as PostKind, topic: "otro", title: "", body: "", imageUrl: "", creatorTypes: [] as string[] };

export interface PostFormValues {
  kind: PostKind;
  topic: string;
  title: string;
  body: string;
  imageUrl: string;
  creatorTypes: string[];
}

/** Publicar (o editar, si llega `editing`). */
export default function NewPostForm({ editing, onDone }: { editing?: { id: string; values: PostFormValues }; onDone?: () => void }) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(Boolean(editing));
  const [v, setV] = useState<PostFormValues>(editing?.values ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) => setV((c) => ({ ...c, [key]: value }));
  const kind = POST_KINDS.find((k) => k.id === v.kind)!;
  const chip = (on: boolean) =>
    `rounded-full border px-sp-3 py-1.5 text-sm transition ${on ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink/75 hover:border-coral"}`;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(editing ? `/api/admin/community/posts/${editing.id}` : "/api/admin/community/posts", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; id?: string };
    setSaving(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo publicar", "Couldn't post"));
    if (editing) {
      showToast("success", t("Publicación actualizada", "Post updated"));
      onDone?.();
      router.refresh();
      return;
    }
    showToast("success", t("¡Publicado! 🎉", "Posted! 🎉"));
    setV(EMPTY);
    setOpen(false);
    router.push(`/admin/comunidad/${data.id}`);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-sp-3 rounded-[18px] border border-line bg-white px-sp-5 py-sp-4 text-left text-ink/55 transition hover:border-coral"
      >
        <span>{t("¿Qué quieres compartir con otros creadores?", "What do you want to share with other creators?")}</span>
        <span className="rounded-full bg-coral px-sp-4 py-1.5 text-sm font-semibold text-white">{t("Publicar", "Post")}</span>
      </button>
    );
  }

  const Wrapper = editing ? "div" : Card;
  return (
    <Wrapper className="flex flex-col gap-sp-4">
      <form onSubmit={submit} className="flex flex-col gap-sp-4">
        <div>
          <p className="mb-sp-2 text-sm font-medium text-ink">{t("¿Qué vas a publicar?", "What are you posting?")}</p>
          <div className="flex flex-wrap gap-sp-2">
            {POST_KINDS.map((k) => (
              <button key={k.id} type="button" aria-pressed={v.kind === k.id} onClick={() => set("kind", k.id)} className={chip(v.kind === k.id)}>
                {pickLabel(lang, k)}
              </button>
            ))}
          </div>
          <p className="mt-sp-2 text-xs text-ink/55">{lang === "en" ? kind.hintEn : kind.hint}</p>
        </div>
        <div className="grid gap-sp-4 sm:grid-cols-[1fr_220px]">
          <label className={labelClass}>
            <span className="text-sm font-medium text-ink">{t("Título", "Title")}</span>
            <input
              required
              minLength={LIMITS.title.min}
              maxLength={LIMITS.title.max}
              value={v.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={
                v.kind === "pregunta"
                  ? t("Ej.: ¿Cuánto cobran por un video UGC de 30 s?", "E.g.: How much do you charge for a 30s UGC video?")
                  : t("Un título corto y claro", "A short, clear title")
              }
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className="text-sm font-medium text-ink">{t("Tema", "Topic")}</span>
            <select value={v.topic} onChange={(e) => set("topic", e.target.value)} className={inputClass}>
              {TOPICS.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {pickLabel(lang, tp)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={labelClass}>
          <span className="text-sm font-medium text-ink">{t("Cuéntalo", "Tell us more")}</span>
          <textarea
            required
            rows={5}
            minLength={LIMITS.body.min}
            maxLength={LIMITS.body.max}
            value={v.body}
            onChange={(e) => set("body", e.target.value)}
            className={inputClass}
            placeholder={t("Da contexto: tu nicho, tu red, qué ya probaste…", "Give context: your niche, your platform, what you've tried…")}
          />
          <span className="text-right text-[11px] text-ink/40">
            {v.body.length}/{LIMITS.body.max}
          </span>
        </label>
        <div>
          <p className="text-sm font-medium text-ink">
            {v.kind === "colaboracion"
              ? t("¿Con qué tipo de creador quieres colaborar?", "What kind of creator do you want to collab with?")
              : t("¿Para qué creadores es? (opcional)", "Who is it for? (optional)")}
          </p>
          <div className="mt-sp-2 flex flex-wrap gap-sp-2">
            {CREATOR_TYPES.map((ct) => {
              const on = v.creatorTypes.includes(ct.id);
              return (
                <button
                  key={ct.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("creatorTypes", on ? v.creatorTypes.filter((x) => x !== ct.id) : [...v.creatorTypes, ct.id])}
                  className={chip(on)}
                >
                  {pickLabel(lang, ct)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="max-w-xs">
          <ImageUploadField label={t("Imagen (opcional)", "Image (optional)")} value={v.imageUrl} onChange={(url) => set("imageUrl", url)} recommendedSize="1200 × 900 px" />
        </div>
        <div className="flex flex-wrap gap-sp-3">
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? t("Publicando…", "Posting…") : editing ? t("Guardar cambios", "Save changes") : t("Publicar", "Post")}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDone?.();
            }}
            className={secondaryButtonClass}
          >
            {t("Cancelar", "Cancel")}
          </button>
        </div>
      </form>
    </Wrapper>
  );
}
