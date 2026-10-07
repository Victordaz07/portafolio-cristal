"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";
import { MAX_MESSAGE } from "@/lib/circles";

interface Message {
  id: string;
  body: string;
  ago: string;
  hidden: boolean;
  mine: boolean;
  handle: string;
  name: string;
  moderator: boolean;
}

/** Mensajes del círculo y caja para escribir. Las moderadoras pueden ocultar mensajes. */
export default function CircleChat({ slug, moderator, messages }: { slug: string; moderator: boolean; messages: Message[] }) {
  const { t } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch(`/api/admin/community/circles/${slug}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo enviar", "Couldn't send"));
    setBody("");
    router.refresh();
  }

  async function act(id: string, action: "hide" | "show") {
    if (action === "hide" && !window.confirm(t("¿Ocultar este mensaje?", "Hide this message?"))) return;
    const response = await fetch(`/api/admin/community/circles/messages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    if (!response.ok) return showToast("error", t("No se pudo guardar", "Couldn't save"));
    router.refresh();
  }

  return (
    <>
      <Card>
        <form onSubmit={send} className="flex flex-col gap-sp-2">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={MAX_MESSAGE} placeholder={t("Comparte algo con el círculo…", "Share something with the circle…")} className={inputClass} />
          <div className="flex items-center justify-between gap-sp-2">
            <span className="text-xs text-ink/50">{body.length}/{MAX_MESSAGE} · {t("Respeta las reglas de la comunidad.", "Follow the community rules.")}</span>
            <button type="submit" disabled={busy || !body.trim()} className={primaryButtonClass}>{t("Enviar", "Send")}</button>
          </div>
        </form>
      </Card>
      <Card>
        {messages.length === 0 ? (
          <p className="text-sm text-ink/60">{t("Todavía no hay mensajes. ¡Escribe el primero!", "No messages yet. Write the first one!")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {messages.map((m) => (
              <li key={m.id} className={`flex flex-col gap-1 py-sp-3 text-sm ${m.hidden ? "opacity-50" : ""}`}>
                <p className="text-xs text-ink/60">
                  <Link href={`/admin/comunidad/creador/${m.handle}`} className="font-semibold text-ink hover:underline">{m.name}</Link>
                  {m.moderator && <span className="ml-1 rounded-full bg-lime/40 px-1.5 py-0.5 text-[10px] font-semibold text-ink">{t("moderadora", "moderator")}</span>}
                  {" · "}{m.ago}{m.hidden ? ` · ${t("oculto", "hidden")}` : ""}
                </p>
                <p className="whitespace-pre-line text-ink">{m.body}</p>
                <span className="flex gap-sp-3 text-xs">
                  {moderator && (m.hidden ? <button type="button" onClick={() => act(m.id, "show")} className="font-semibold text-cobalt hover:underline">{t("Mostrar", "Show")}</button> : <button type="button" onClick={() => act(m.id, "hide")} className="text-red-600/70 hover:text-red-600">{t("Ocultar", "Hide")}</button>)}
                  {!moderator && m.mine && <button type="button" onClick={() => act(m.id, "hide")} className="text-red-600/70 hover:text-red-600">{t("Borrar", "Delete")}</button>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
