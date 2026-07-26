"use client";

import { useState } from "react";
import type { FaqItem } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import BilingualTextField from "@/components/admin/BilingualTextField";
import { swapOrder } from "@/lib/reorder";
import { primaryButtonClass, rowCardStartClass, cardClass, dangerLinkClass } from "@/lib/admin-ui";

const API_BASE = "/api/admin/faq";

export default function FaqManager({ initialFaqItems }: { initialFaqItems: FaqItem[] }) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initialFaqItems);
  const [question, setQuestion] = useState("");
  const [questionEn, setQuestionEn] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerEn, setAnswerEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FaqItem | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, questionEn, answer, answerEn }),
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
    setQuestionEn("");
    setAnswer("");
    setAnswerEn("");
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
          <li key={item.id} className={rowCardStartClass}>
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
              className={dangerLinkClass}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className={`${cardClass} mt-sp-6 flex flex-col gap-sp-4 max-w-lg`}>
        <BilingualTextField
          label="Pregunta"
          es={question}
          en={questionEn}
          onEsChange={setQuestion}
          onEnChange={setQuestionEn}
          required
        />
        <BilingualTextField
          label="Respuesta"
          es={answer}
          en={answerEn}
          onEsChange={setAnswer}
          onEnChange={setAnswerEn}
          multiline
          rows={3}
          required
        />
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
