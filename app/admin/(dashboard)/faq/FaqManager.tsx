"use client";

import { useState } from "react";
import type { FaqItemModel as FaqItem } from "@/lib/generated/prisma/models";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import { swapOrder } from "@/lib/reorder";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";

const API_BASE = "/api/admin/faq";

export default function FaqManager({ initialFaqItems }: { initialFaqItems: FaqItem[] }) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initialFaqItems);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FaqItem | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo agregar la pregunta");
      return;
    }

    const created: FaqItem = await response.json();
    setItems((current) => [...current, created]);
    setQuestion("");
    setAnswer("");
    showToast("success", "Pregunta agregada");
  }

  async function handleDelete(item: FaqItem) {
    const response = await fetch(`${API_BASE}/${item.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", "No se pudo eliminar");
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    showToast("success", "Pregunta eliminada");
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(items, index, direction, API_BASE);
    setItems(next);
  }

  return (
    <div>
      <ul className="flex flex-col gap-sp-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="flex items-start gap-sp-4 rounded-md border border-line bg-white px-sp-4 py-sp-3"
          >
            <ReorderButtons
              onUp={() => handleMove(index, "up")}
              onDown={() => handleMove(index, "down")}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
            <div className="flex-1">
              <p className="font-medium text-ink">{item.question}</p>
              <p className="mt-1 text-sm text-ink/60">{item.answer}</p>
            </div>
            <button
              type="button"
              onClick={() => setPendingDelete(item)}
              className="text-sm text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-sp-6 flex flex-col gap-sp-4 max-w-lg">
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Pregunta</span>
          <input
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Respuesta</span>
          <textarea
            required
            rows={3}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className={inputClass}
          />
        </label>
        <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
          {saving ? "Agregando..." : "+ agregar pregunta"}
        </button>
      </form>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar pregunta"
          description={`¿Eliminar "${pendingDelete.question}"?`}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
