"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass, accentLinkClass } from "@/lib/admin-ui";
import { LOG_KIND_LABEL, formatDateKey, type LogKind } from "@/lib/growth";

export interface LogView {
  id: string;
  kind: LogKind;
  date: string;
  title: string;
  body: string;
}

const eyebrowClass = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

type FormState = { id: string | null; kind: LogKind; date: string; title: string; body: string };

function byDateDesc(a: LogView, b: LogView) {
  return b.date.localeCompare(a.date);
}

export default function LogManager({
  initialEntries,
  streak,
  today,
}: {
  initialEntries: LogView[];
  streak: number;
  today: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [entries, setEntries] = useState(initialEntries);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<LogView | null>(null);

  const timeline = entries.filter((e) => e.kind !== "journal").sort(byDateDesc);
  const journal = entries.filter((e) => e.kind === "journal").sort(byDateDesc);
  const stats = [
    { value: String(entries.filter((e) => e.kind === "milestone").length), label: "Hitos alcanzados" },
    { value: String(journal.length), label: "Entradas del diario" },
    { value: `${streak} ${streak === 1 ? "día" : "días"}`, label: "Racha activa" },
  ];

  function open(kind: LogKind, entry?: LogView) {
    setForm(
      entry
        ? { id: entry.id, kind: entry.kind, date: entry.date, title: entry.title, body: entry.body }
        : { id: null, kind, date: today, title: kind === "journal" ? "Reflexión de la semana" : "", body: "" }
    );
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    const { id, ...payload } = form;
    const response = await fetch(id ? `/api/admin/log/${id}` : "/api/admin/log", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      showToast("error", data.error ?? "No se pudo guardar");
      return;
    }
    const saved: LogView = { id: data.id, kind: data.kind, date: data.date, title: data.title, body: data.body };
    setEntries((current) => (id ? current.map((e) => (e.id === id ? saved : e)) : [saved, ...current]));
    setForm(null);
    showToast("success", id ? "Entrada actualizada" : "Guardado en tu bitácora");
    router.refresh(); // actualiza la racha
  }

  async function remove(entry: LogView) {
    setDeleting(null);
    const response = await fetch(`/api/admin/log/${entry.id}`, { method: "DELETE" });
    if (!response.ok) return showToast("error", "No se pudo borrar");
    setEntries((current) => current.filter((e) => e.id !== entry.id));
    showToast("success", "Entrada borrada");
    router.refresh();
  }

  const formCard = form && (
    <Card>
      <p className={`${eyebrowClass} mb-sp-4`}>
        {form.id ? "Editar" : "Nueva entrada"} · {LOG_KIND_LABEL[form.kind]}
      </p>
      <form onSubmit={save} className="flex flex-col gap-sp-4">
        <div className="grid gap-sp-4 sm:grid-cols-[1fr_180px]">
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Título</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => f && { ...f, title: e.target.value })}
              className={inputClass}
              placeholder={form.kind === "milestone" ? "Ej: Primera colaboración pagada" : "Ej: Aprendizaje sobre formatos"}
            />
          </label>
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Fecha</span>
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => f && { ...f, date: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>
        {form.kind !== "journal" && (
          <div className="flex gap-sp-2">
            {(["milestone", "learning"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setForm((f) => f && { ...f, kind })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                  form.kind === kind ? "bg-ink text-cream" : "bg-cream text-ink/70"
                }`}
              >
                {LOG_KIND_LABEL[kind]}
              </button>
            ))}
          </div>
        )}
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{form.kind === "journal" ? "Reflexión" : "Detalle (opcional)"}</span>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => f && { ...f, body: e.target.value })}
            rows={form.kind === "journal" ? 5 : 3}
            className={`${inputClass} resize-y`}
            placeholder={form.kind === "journal" ? "¿Qué funcionó esta semana? ¿Qué vas a probar?" : ""}
          />
        </label>
        <div className="flex gap-sp-3">
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" onClick={() => setForm(null)} className={secondaryButtonClass}>
            Cancelar
          </button>
        </div>
      </form>
    </Card>
  );

  return (
    <div className="flex flex-col gap-sp-5">
      <div className="grid gap-3.5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[16px] bg-ink p-sp-4 text-cream">
            <p className="font-fraunces text-[26px] font-semibold text-lime">{stat.value}</p>
            <p className="text-[11px] text-cream/65">{stat.label}</p>
          </div>
        ))}
      </div>
      <p className="-mt-sp-3 text-[11px] text-ink/45">
        La racha cuenta los días seguidos con una entrada en la bitácora, una tarea completada del plan o una publicación nueva en el Feed.
      </p>

      {form && form.kind !== "journal" && formCard}

      <Card className="p-sp-5 sm:p-sp-6">
        <div className="mb-sp-5 flex flex-wrap items-center justify-between gap-sp-3">
          <p className={eyebrowClass}>Línea de hitos</p>
          <div className="flex gap-sp-2">
            <button type="button" onClick={() => open("milestone")} className={secondaryButtonClass}>
              + Hito
            </button>
            <button type="button" onClick={() => open("learning")} className={secondaryButtonClass}>
              + Aprendizaje
            </button>
          </div>
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-ink/60">
            Anota tus logros (tu primera marca pagada, 10K seguidores…) y lo que vas aprendiendo. Verlos juntos motiva.
          </p>
        ) : (
          <ol>
            {timeline.map((entry, index) => {
              const milestone = entry.kind === "milestone";
              return (
                <li key={entry.id} className="grid grid-cols-[64px_20px_1fr] gap-sp-3 sm:grid-cols-[80px_24px_1fr]">
                  <p className="pt-0.5 text-right font-mono text-[11px] text-ink/55">{formatDateKey(entry.date)}</p>
                  <div className="flex flex-col items-center">
                    <span className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ${milestone ? "bg-coral" : "bg-lime"}`} />
                    {index < timeline.length - 1 && <span className="mt-0.5 w-0.5 flex-1 bg-ink/10" />}
                  </div>
                  <div className="pb-sp-5">
                    <div className="flex flex-wrap items-center gap-sp-2">
                      <p className="text-sm font-bold text-ink">{entry.title}</p>
                      <span
                        className={`rounded-full px-[7px] py-px font-mono text-[9px] uppercase ${
                          milestone ? "bg-coral text-white" : "bg-lime/30 text-moss"
                        }`}
                      >
                        {LOG_KIND_LABEL[entry.kind]}
                      </span>
                    </div>
                    {entry.body && <p className="mt-0.5 text-xs text-ink/65">{entry.body}</p>}
                    <div className="mt-1 flex gap-sp-3">
                      <button type="button" onClick={() => open(entry.kind, entry)} className="text-xs text-coral hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => setDeleting(entry)} className="text-xs text-ink/40 hover:text-ink">
                        Borrar
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      {form?.kind === "journal" && formCard}

      <Card>
        <div className="mb-sp-4 flex items-center justify-between gap-sp-3">
          <p className={eyebrowClass}>Diario de contenido</p>
          <button
            type="button"
            onClick={() => open("journal")}
            className="rounded-full bg-ink px-sp-4 py-sp-2 text-xs font-semibold text-cream hover:opacity-90"
          >
            + Nueva entrada
          </button>
        </div>
        {journal.length === 0 ? (
          <p className="text-sm text-ink/60">Una reflexión corta por semana: qué funcionó, qué no y qué vas a probar.</p>
        ) : (
          <ul className="flex flex-col">
            {journal.map((entry) => (
              <li key={entry.id} className="flex gap-sp-3 border-b border-line py-sp-3 last:border-0">
                <p className="w-[72px] shrink-0 font-mono text-[11px] text-ink/55">{formatDateKey(entry.date)}</p>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{entry.title}</p>
                  {entry.body && <p className="mt-0.5 whitespace-pre-line text-xs text-ink/75">{entry.body}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button type="button" onClick={() => open("journal", entry)} className={`${accentLinkClass} text-xs`}>
                    Editar
                  </button>
                  <button type="button" onClick={() => setDeleting(entry)} className="text-xs text-ink/40 hover:text-ink">
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {deleting && (
        <ConfirmDialog
          title="Borrar entrada"
          description={`¿Seguro que quieres borrar "${deleting.title}"?`}
          onConfirm={() => remove(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
