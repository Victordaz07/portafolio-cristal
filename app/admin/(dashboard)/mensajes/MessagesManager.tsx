"use client";

import { useState } from "react";
import type { ContactMessageModel as ContactMessage } from "@/lib/generated/prisma/models";
import { useToast } from "@/components/admin/ToastContext";

const API_BASE = "/api/admin/messages";

export default function MessagesManager({
  initialMessages,
}: {
  initialMessages: ContactMessage[];
}) {
  const { showToast } = useToast();
  const [messages, setMessages] = useState(initialMessages);

  async function toggleRead(message: ContactMessage) {
    const response = await fetch(`${API_BASE}/${message.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: !message.read }),
    });

    if (!response.ok) {
      showToast("error", "No se pudo actualizar el mensaje");
      return;
    }

    const updated: ContactMessage = await response.json();
    setMessages((current) => current.map((item) => (item.id === message.id ? updated : item)));
  }

  if (messages.length === 0) {
    return <p className="text-ink/60">Todavía no has recibido mensajes.</p>;
  }

  return (
    <ul className="flex flex-col gap-sp-4">
      {messages.map((message) => (
        <li
          key={message.id}
          className={`rounded-md border p-sp-5 ${
            message.read ? "border-line bg-white" : "border-coral bg-white"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-sp-3">
            <div>
              <p className="font-medium text-ink">
                {message.name} — {message.brand}
              </p>
              <p className="font-mono text-xs text-moss">
                {message.email} · {message.collaborationType}
              </p>
              <p className="font-mono text-xs text-ink/50 mt-1">
                {new Date(message.createdAt).toLocaleString("es-DO")}
              </p>
            </div>
            <div className="flex items-center gap-sp-3">
              {!message.read && (
                <span className="rounded-full bg-coral px-sp-3 py-1 font-mono text-[10px] uppercase text-white">
                  Nuevo
                </span>
              )}
              <button
                type="button"
                onClick={() => toggleRead(message)}
                className="text-sm text-coral hover:underline"
              >
                {message.read ? "Marcar no leído" : "Marcar leído"}
              </button>
            </div>
          </div>
          <p className="mt-sp-3 text-sm text-ink/80 whitespace-pre-line">{message.message}</p>
        </li>
      ))}
    </ul>
  );
}
