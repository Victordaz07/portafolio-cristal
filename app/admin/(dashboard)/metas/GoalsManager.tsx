"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass, accentLinkClass } from "@/lib/admin-ui";
import {
  GOAL_CATEGORIES,
  GOAL_CATEGORY_LABEL,
  GOAL_SOURCES,
  categoryLabel,
  formatGoalValue,
  goalPercent,
  type GoalCategory,
  type GoalSource,
} from "@/lib/growth";

export interface GoalView {
  id: string;
  title: string;
  category: string;
  current: number;
  target: number;
  unit: string | null;
  source: string;
  dueDate: string | null;
  autoMissing: boolean;
}

export interface ActionView {
  id: string;
  label: string;
  category: string;
  done: boolean;
}

interface GoalForm {
  title: string;
  category: GoalCategory;
  source: GoalSource;
  current: string;
  target: string;
  unit: string;
  dueDate: string;
}

const EMPTY_FORM: GoalForm = {
  title: "",
  category: "content",
  source: "manual",
  current: "0",
  target: "",
  unit: "",
  dueDate: "",
};

const SOURCE_PLATFORM: Partial<Record<GoalSource, string>> = {
  instagram_followers: "instagram",
  tiktok_followers: "tiktok",
  youtube_followers: "youtube",
  facebook_followers: "facebook",
};

const eyebrowClass = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

function toForm(goal: GoalView): GoalForm {
  return {
    title: goal.title,
    category: (GOAL_CATEGORIES as readonly string[]).includes(goal.category) ? (goal.category as GoalCategory) : "content",
    source: goal.source in GOAL_SOURCES ? (goal.source as GoalSource) : "manual",
    current: String(goal.current),
    target: String(goal.target),
    unit: goal.unit ?? "",
    dueDate: goal.dueDate ? goal.dueDate.slice(0, 10) : "",
  };
}

async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

export default function GoalsManager({
  phrase,
  overall,
  weekLabel,
  pendingOld,
  connectedPlatforms,
  initialGoals,
  initialActions,
}: {
  phrase: string;
  overall: number;
  weekLabel: string;
  pendingOld: number;
  connectedPlatforms: string[];
  initialGoals: GoalView[];
  initialActions: ActionView[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [goals, setGoals] = useState(initialGoals);
  const [actions, setActions] = useState(initialActions);
  const [formFor, setFormFor] = useState<"new" | string | null>(null);
  const [form, setForm] = useState<GoalForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GoalView | null>(null);
  const [newAction, setNewAction] = useState("");
  const [newActionCategory, setNewActionCategory] = useState<GoalCategory>("content");

  // El servidor recalcula los valores automáticos; al refrescar, se toman sus datos.
  useEffect(() => setGoals(initialGoals), [initialGoals]);
  useEffect(() => setActions(initialActions), [initialActions]);

  const doneCount = actions.filter((a) => a.done).length;
  const isAuto = form.source !== "manual";

  function openForm(goal?: GoalView) {
    setForm(goal ? toForm(goal) : EMPTY_FORM);
    setFormFor(goal ? goal.id : "new");
  }

  async function saveGoal(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      category: form.category,
      source: form.source,
      current: Number(form.current) || 0,
      target: Number(form.target),
      unit: form.unit,
      dueDate: form.dueDate,
    };
    const { ok, data } =
      formFor === "new"
        ? await send("/api/admin/goals", "POST", payload)
        : await send(`/api/admin/goals/${formFor}`, "PATCH", payload);
    setSaving(false);
    if (!ok) {
      showToast("error", data.error ?? "No se pudo guardar la meta");
      return;
    }
    showToast("success", formFor === "new" ? "Meta creada" : "Meta actualizada");
    setFormFor(null);
    router.refresh();
  }

  async function updateCurrent(goal: GoalView, value: number) {
    setGoals((current) => current.map((g) => (g.id === goal.id ? { ...g, current: value } : g)));
    const { ok } = await send(`/api/admin/goals/${goal.id}`, "PATCH", { current: value });
    if (!ok) showToast("error", "No se pudo actualizar el progreso");
    router.refresh();
  }

  async function deleteGoal(goal: GoalView) {
    setDeleting(null);
    const { ok } = await send(`/api/admin/goals/${goal.id}`, "DELETE");
    if (!ok) return showToast("error", "No se pudo borrar la meta");
    setGoals((current) => current.filter((g) => g.id !== goal.id));
    showToast("success", "Meta borrada");
    router.refresh();
  }

  async function toggleAction(action: ActionView) {
    setActions((current) => current.map((a) => (a.id === action.id ? { ...a, done: !a.done } : a)));
    const { ok } = await send(`/api/admin/actions/${action.id}`, "PATCH", { done: !action.done });
    if (!ok) {
      showToast("error", "No se pudo guardar");
      setActions((current) => current.map((a) => (a.id === action.id ? { ...a, done: action.done } : a)));
    }
  }

  async function addAction(event: React.FormEvent) {
    event.preventDefault();
    if (!newAction.trim()) return;
    const { ok, data } = await send("/api/admin/actions", "POST", { label: newAction, category: newActionCategory });
    if (!ok) return showToast("error", data.error ?? "No se pudo agregar");
    setActions((current) => [...current, data as ActionView]);
    setNewAction("");
  }

  async function deleteAction(action: ActionView) {
    const { ok } = await send(`/api/admin/actions/${action.id}`, "DELETE");
    if (!ok) return showToast("error", "No se pudo borrar");
    setActions((current) => current.filter((a) => a.id !== action.id));
  }

  async function carryOver() {
    const { ok, data } = await send("/api/admin/actions/carry-over", "POST");
    if (!ok) return showToast("error", "No se pudieron traer las tareas");
    showToast("success", `${data.moved} ${data.moved === 1 ? "tarea traída" : "tareas traídas"} a esta semana`);
    router.refresh();
  }

  const overallNow = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + goalPercent(g.current, g.target), 0) / goals.length)
    : overall;

  return (
    <div className="flex flex-col gap-sp-5">
      <div className="flex flex-wrap items-center justify-between gap-sp-5 rounded-[20px] bg-ink p-sp-5 text-cream sm:p-7">
        <div>
          <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.1em] text-lime">Tu próximo nivel</p>
          <p className="max-w-[520px] font-fraunces text-[26px] font-medium italic leading-snug sm:text-[32px]">{phrase}</p>
        </div>
        <div className="shrink-0 text-center">
          <p className="font-fraunces text-[40px] font-semibold text-lime">{overallNow}%</p>
          <p className="mt-sp-1 text-[11px] text-cream/65">
            {goals.length ? "promedio de tus metas activas" : "crea tu primera meta"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-sp-3">
        <p className={eyebrowClass}>Tus metas</p>
        <button
          type="button"
          onClick={() => openForm()}
          className="rounded-full bg-coral px-sp-5 py-2.5 text-sm font-bold text-white transition hover:bg-moss"
        >
          + Nueva meta
        </button>
      </div>

      {formFor && (
        <Card>
          <p className={`${eyebrowClass} mb-sp-4`}>{formFor === "new" ? "Nueva meta" : "Editar meta"}</p>
          <form onSubmit={saveGoal} className="flex flex-col gap-sp-4">
            <div className="grid gap-sp-4 sm:grid-cols-2">
              <label className="flex flex-col gap-sp-1 sm:col-span-2">
                <span className="text-sm font-medium text-ink">Meta</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputClass}
                  placeholder="Ej: Llegar a 50K seguidores en Instagram"
                />
              </label>
              <label className="flex flex-col gap-sp-1">
                <span className="text-sm font-medium text-ink">Tipo</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as GoalCategory }))}
                  className={inputClass}
                >
                  {GOAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {GOAL_CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-sp-1">
                <span className="text-sm font-medium text-ink">¿Cómo se mide?</span>
                <select
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as GoalSource }))}
                  className={inputClass}
                >
                  {(Object.keys(GOAL_SOURCES) as GoalSource[]).map((s) => (
                    <option key={s} value={s}>
                      {GOAL_SOURCES[s]}
                    </option>
                  ))}
                </select>
                {SOURCE_PLATFORM[form.source] && !connectedPlatforms.includes(SOURCE_PLATFORM[form.source]!) && (
                  <span className="text-xs text-coral">
                    Esa red no está conectada todavía: el valor se actualizará solo cuando la conectes.
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-sp-1">
                <span className="text-sm font-medium text-ink">Valor actual</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={form.current}
                  disabled={isAuto}
                  onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
                  className={`${inputClass} disabled:opacity-50`}
                />
                {isAuto && <span className="text-xs text-ink/50">Se calcula solo.</span>}
              </label>
              <label className="flex flex-col gap-sp-1">
                <span className="text-sm font-medium text-ink">Objetivo</span>
                <input
                  required
                  type="number"
                  min={0}
                  step="any"
                  value={form.target}
                  onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                  className={inputClass}
                  placeholder="50000"
                />
              </label>
              <label className="flex flex-col gap-sp-1">
                <span className="text-sm font-medium text-ink">Unidad (opcional)</span>
                <input
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className={inputClass}
                  placeholder="videos, días, reels…"
                />
              </label>
              <label className="flex flex-col gap-sp-1">
                <span className="text-sm font-medium text-ink">Fecha límite (opcional)</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className={inputClass}
                />
              </label>
            </div>
            <div className="flex gap-sp-3">
              <button type="submit" disabled={saving} className={primaryButtonClass}>
                {saving ? "Guardando…" : "Guardar meta"}
              </button>
              <button type="button" onClick={() => setFormFor(null)} className={secondaryButtonClass}>
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {goals.length === 0 && !formFor ? (
        <Card className="text-sm text-ink/60">
          Todavía no tienes metas. Crea una: por ejemplo “Publicar 25 piezas este mes” (se cuenta sola con tu Feed) o
          “Llegar a 50K en Instagram” (se actualiza sola al conectar Instagram).
        </Card>
      ) : (
        <div className="grid gap-sp-4 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {goals.map((goal) => {
            const pct = goalPercent(goal.current, goal.target);
            const auto = goal.source !== "manual";
            return (
              <Card key={goal.id} className="flex flex-col gap-sp-3">
                <div className="flex items-start justify-between gap-sp-2">
                  <p className="text-sm font-bold text-ink">{goal.title}</p>
                  <span className="shrink-0 rounded-full bg-lime/30 px-sp-2 py-0.5 font-mono text-[10px] uppercase text-moss">
                    {categoryLabel(goal.category)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="shrink-0 font-mono text-xs font-bold text-coral">{pct}%</span>
                </div>
                <p className="text-[11px] text-ink/65">
                  {formatGoalValue(goal.current, goal.unit)} de {formatGoalValue(goal.target, goal.unit)}
                  {goal.dueDate && ` · hasta el ${goal.dueDate.slice(8, 10)}/${goal.dueDate.slice(5, 7)}`}
                </p>
                {auto ? (
                  <p className={`text-[11px] ${goal.autoMissing ? "text-coral" : "text-ink/45"}`}>
                    {goal.autoMissing ? "Conecta la red en Conectar cuentas para que se actualice sola." : "↻ Se actualiza sola"}
                  </p>
                ) : (
                  <div className="flex items-center gap-sp-2">
                    <button
                      type="button"
                      onClick={() => updateCurrent(goal, Math.max(0, goal.current - 1))}
                      aria-label="Restar 1"
                      className="h-7 w-7 rounded-full border border-line text-sm text-ink/70 hover:border-coral"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrent(goal, goal.current + 1)}
                      aria-label="Sumar 1"
                      className="h-7 w-7 rounded-full border border-line text-sm text-ink/70 hover:border-coral"
                    >
                      +
                    </button>
                    <span className="text-[11px] text-ink/45">Ajusta tu avance</span>
                  </div>
                )}
                <div className="mt-auto flex gap-sp-3 pt-sp-1">
                  <button type="button" onClick={() => openForm(goal)} className={accentLinkClass}>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(goal)}
                    className="text-sm font-medium text-ink/45 hover:text-ink"
                  >
                    Borrar
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <div className="mb-sp-3 flex flex-wrap items-baseline justify-between gap-sp-2">
          <p className={eyebrowClass}>Plan de acción esta semana</p>
          <p className="text-xs text-ink/55">
            {weekLabel} · {doneCount} de {actions.length} listas
          </p>
        </div>

        {pendingOld > 0 && (
          <div className="mb-sp-3 flex flex-wrap items-center justify-between gap-sp-2 rounded-[12px] bg-lime/25 px-sp-3 py-sp-2 text-[13px] text-ink">
            <span>
              Te {pendingOld === 1 ? "quedó 1 tarea pendiente" : `quedaron ${pendingOld} tareas pendientes`} de semanas anteriores.
            </span>
            <button type="button" onClick={carryOver} className="font-semibold text-coral hover:underline">
              Traer a esta semana
            </button>
          </div>
        )}

        {actions.length === 0 ? (
          <p className="text-sm text-ink/60">Agrega 3 o 4 acciones concretas para esta semana.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {actions.map((action) => (
              <li key={action.id} className="group flex items-center gap-sp-3">
                <button
                  type="button"
                  onClick={() => toggleAction(action)}
                  role="checkbox"
                  aria-checked={action.done}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 text-xs text-white transition ${
                    action.done ? "border-coral bg-coral" : "border-ink/25 bg-transparent hover:border-coral"
                  }`}
                >
                  {action.done && "✓"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleAction(action)}
                  className={`flex-1 text-left text-[13px] ${action.done ? "text-ink/55 line-through" : "text-ink"}`}
                >
                  {action.label}
                </button>
                <span className="shrink-0 font-mono text-[10px] text-ink/55">{categoryLabel(action.category)}</span>
                <button
                  type="button"
                  onClick={() => deleteAction(action)}
                  aria-label={`Borrar ${action.label}`}
                  className="shrink-0 text-xs text-ink/30 hover:text-coral sm:opacity-0 sm:group-hover:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addAction} className="mt-sp-4 flex flex-col gap-sp-2 sm:flex-row">
          <input
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            className={`${inputClass} flex-1`}
            placeholder="Ej: Grabar 3 reels en batch"
            aria-label="Nueva tarea"
          />
          <select
            value={newActionCategory}
            onChange={(e) => setNewActionCategory(e.target.value as GoalCategory)}
            className={`${inputClass} sm:w-40`}
            aria-label="Tipo de tarea"
          >
            {GOAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {GOAL_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <button type="submit" disabled={!newAction.trim()} className={secondaryButtonClass}>
            Agregar
          </button>
        </form>
      </Card>

      {deleting && (
        <ConfirmDialog
          title="Borrar meta"
          description={`¿Seguro que quieres borrar "${deleting.title}"?`}
          onConfirm={() => deleteGoal(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
