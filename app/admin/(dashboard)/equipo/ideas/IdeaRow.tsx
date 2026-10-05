"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, secondaryButtonClass, dangerLinkClass } from "@/lib/admin-ui";
import { IDEA_STATUS, ideaCategoryLabel } from "@/lib/ideas";
import { pickLabel } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

export type IdeaView = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  teamReply: string | null;
  internalNote: string | null;
  source: string;
  fromAccount: boolean;
  createdAt: string;
};

export default function IdeaRow({ idea }: { idea: IdeaView }) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(idea.teamReply ?? "");
  const [note, setNote] = useState(idea.internalNote ?? "");
  const [busy, setBusy] = useState(false);

  async function save(body: Record<string, string>, ok: string) {
    setBusy(true);
    const response = await fetch(`/api/admin/team/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) return showToast("error", t("No se pudo guardar", "Couldn't save"));
    showToast("success", ok);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(t("¿Borrar esta idea?", "Delete this idea?"))) return;
    const response = await fetch(`/api/admin/team/ideas/${idea.id}`, { method: "DELETE" });
    if (!response.ok) return showToast("error", t("No se pudo borrar", "Couldn't delete"));
    router.refresh();
  }

  return (
    <li className="flex flex-col gap-sp-2 border-t border-line py-sp-4 first:border-0">
      <div className="flex flex-wrap items-start gap-sp-2">
        <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 text-left">
          <span className="block font-semibold text-ink hover:text-coral">{idea.title}</span>
          <span className="text-xs text-ink/60">
            {idea.fromAccount ? `💬 ${idea.source}` : `🧠 ${t("Equipo", "Team")} · ${idea.source}`} · {ideaCategoryLabel(idea.category, lang)} · {idea.createdAt}
          </span>
        </button>
        <select
          className="rounded-full border border-line bg-white px-sp-3 py-1 text-xs font-semibold"
          value={idea.status}
          disabled={busy}
          onChange={(e) => save({ status: e.target.value }, t("Estado actualizado", "Status updated"))}
          aria-label={t("Estado", "Status")}
        >
          {IDEA_STATUS.map((s) => (
            <option key={s.id} value={s.id}>
              {pickLabel(lang, s)}
            </option>
          ))}
        </select>
      </div>
      {open && (
        <div className="flex flex-col gap-sp-3 rounded-[14px] bg-cream/60 p-sp-3">
          {idea.description && <p className="whitespace-pre-wrap text-sm text-ink">{idea.description}</p>}
          {idea.fromAccount && (
            <label className="flex flex-col gap-sp-1 text-sm">
              <span className="font-semibold text-ink">{t("Respuesta para la cuenta (la ve en «Ideas y sugerencias»)", "Reply to the account (they see it in “Ideas & suggestions”)")}</span>
              <textarea className={`${inputClass} min-h-[70px]`} value={reply} maxLength={2000} onChange={(e) => setReply(e.target.value)} />
            </label>
          )}
          <label className="flex flex-col gap-sp-1 text-sm">
            <span className="font-semibold text-ink">{t("Nota interna del equipo", "Internal team note")}</span>
            <textarea className={`${inputClass} min-h-[70px]`} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="flex flex-wrap items-center gap-sp-3">
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={busy}
              onClick={() => save(idea.fromAccount ? { teamReply: reply, internalNote: note } : { internalNote: note }, t("Guardado", "Saved"))}
            >
              {t("Guardar", "Save")}
            </button>
            <button type="button" className={dangerLinkClass} onClick={remove}>
              {t("Borrar", "Delete")}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
