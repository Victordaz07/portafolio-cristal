"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";
import { dateLocale } from "@/lib/admin-lang";
import { LIMITS } from "@/lib/community";
import LinkifiedText from "@/components/community/LinkifiedText";
import ReportButton from "@/components/community/ReportButton";

export type ChatMessage = { id: string; mine: boolean; body: string; createdAt: string };

/** El chat con una conexión: muestra los mensajes, busca nuevos cada 10 s y envía. */
export default function ChatThread({ handle, initial, canSend }: { handle: string; initial: ChatMessage[]; canSend: boolean }) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const last = useRef(initial.at(-1)?.createdAt ?? "");

  const add = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...prev, ...incoming.filter((m) => !seen.has(m.id))];
    });
    last.current = incoming.at(-1)!.createdAt;
  }, []);

  // Buscar mensajes nuevos cada 10 s (solo con la pestaña visible).
  useEffect(() => {
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      const qs = last.current ? `?after=${encodeURIComponent(last.current)}` : "";
      const response = await fetch(`/api/admin/community/messages/${handle}${qs}`).catch(() => null);
      if (!response?.ok) return;
      const data = (await response.json().catch(() => ({}))) as { messages?: ChatMessage[] };
      add(data.messages ?? []);
    };
    const timer = setInterval(poll, LIMITS.messagePollMs);
    return () => clearInterval(timer);
  }, [handle, add]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    const response = await fetch(`/api/admin/community/messages/${handle}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; message?: ChatMessage };
    setBusy(false);
    if (!response.ok || !data.message) return showToast("error", data.error ?? t("No se pudo enviar", "Couldn't send"));
    setText("");
    add([data.message]);
  }

  const time = (iso: string) => {
    const d = new Date(iso);
    const today = new Date().toDateString() === d.toDateString();
    return d.toLocaleString(dateLocale(lang), today ? { hour: "numeric", minute: "2-digit" } : { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col gap-sp-3">
      <div className="flex max-h-[60vh] min-h-[240px] flex-col gap-sp-2 overflow-y-auto rounded-[18px] border border-line bg-white p-sp-3 sm:p-sp-4">
        {messages.length === 0 && (
          <p className="m-auto text-center text-sm text-ink/50">{t("Todavía no se han escrito. ¡Saluda! 👋", "No messages yet. Say hi! 👋")}</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex max-w-[85%] flex-col ${m.mine ? "items-end self-end" : "items-start self-start"}`}>
            <div className={`whitespace-pre-line break-words rounded-[16px] px-sp-3 py-sp-2 text-sm ${m.mine ? "rounded-br-[4px] bg-ink text-cream" : "rounded-bl-[4px] bg-cream text-ink"}`}>
              <LinkifiedText text={m.body} />
            </div>
            <span className="mt-0.5 flex items-center gap-sp-2 text-[11px] text-ink/40">
              {time(m.createdAt)}
              {!m.mine && <ReportButton targetType="message" targetId={m.id} className="text-[11px]" />}
            </span>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {canSend && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-sp-2"
        >
          <textarea
            rows={2}
            maxLength={LIMITS.message}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t("Escribe un mensaje…", "Write a message…")}
            title={t("Enter envía · Shift+Enter baja de línea", "Enter sends · Shift+Enter adds a line")}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <button type="submit" disabled={busy || !text.trim()} className={primaryButtonClass}>
            {busy ? "…" : t("Enviar", "Send")}
          </button>
        </form>
      )}
    </div>
  );
}
