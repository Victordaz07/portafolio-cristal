"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { accentLinkClass, inputClass } from "@/lib/admin-ui";
import type { InboxComment } from "@/lib/social/instagram-comments";

const MESSAGES_API = "/api/admin/messages";
const IG_API = "/api/admin/inbox/instagram";

export interface InboxMessage {
  id: string;
  name: string;
  brand: string;
  email: string;
  collaborationType: string;
  message: string;
  read: boolean;
  repliedAt: string | null;
  createdAt: string;
}

type Filter = "all" | "pending" | "form" | "instagram";
type Item =
  | { kind: "form"; id: string; date: string; pending: boolean; msg: InboxMessage }
  | { kind: "ig"; id: string; date: string; pending: boolean; comment: InboxComment };

const COMMENT_REPLIES = [
  "¡Gracias por tu comentario! 💛",
  "Te escribo por DM con los detalles",
  "Lo puedes encontrar en el link de mi bio",
  "¡Me alegra que te haya gustado!",
];

function formReplies(mediaKitUrl: string) {
  return [
    `¡Gracias por escribirme! Me encantaría colaborar. Aquí está mi media kit con mis números y paquetes: ${mediaKitUrl}`,
    "¿Me compartes el brief, las fechas y el presupuesto aproximado? Así te preparo una propuesta.",
    "¡Gracias por pensar en mí! Ahora mismo tengo la agenda llena, pero me encantaría trabajar juntos más adelante.",
  ];
}

function hoursSince(date: string) {
  return (Date.now() - new Date(date).getTime()) / 36e5;
}

// Con acceso estándar, Meta no entrega el usuario de quien comenta si no tiene rol en la app.
function igName(username: string) {
  return username ? `@${username}` : "Usuario de Instagram";
}

function timeAgo(date: string) {
  const hours = hoursSince(date);
  if (hours < 1) return `hace ${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 24) return `hace ${Math.round(hours)} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

function SourceBadge({ kind }: { kind: Item["kind"] }) {
  return kind === "ig" ? (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral to-moss font-mono text-[9px] font-bold text-white">
      IG
    </span>
  ) : (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-[9px] font-bold text-cream">
      @
    </span>
  );
}

export default function InboxManager({
  initialMessages,
  brandNames,
  instagramUsername,
  signature,
  mediaKitUrl,
}: {
  initialMessages: InboxMessage[];
  brandNames: string[];
  /** null si Instagram no está conectado. */
  instagramUsername: string | null;
  signature: string;
  mediaKitUrl: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [comments, setComments] = useState<InboxComment[]>([]);
  const [igStats, setIgStats] = useState<{ reported: number; own: number } | null>(null);
  const [igState, setIgState] = useState<"off" | "loading" | "ready" | "error">(instagramUsername === null ? "off" : "loading");
  const [igError, setIgError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openReply, setOpenReply] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [kitUrl, setKitUrl] = useState(mediaKitUrl);

  useEffect(() => {
    // Sin APP_URL configurada, el enlace del media kit usa el dominio actual.
    if (mediaKitUrl.startsWith("/")) setKitUrl(`${window.location.origin}${mediaKitUrl}`);
  }, [mediaKitUrl]);

  async function loadComments() {
    setIgState("loading");
    const response = await fetch(IG_API).catch(() => null);
    const data = response ? await response.json().catch(() => null) : null;
    if (!response?.ok || !data) {
      setIgError(data?.error ?? "No se pudieron cargar los comentarios");
      setIgState("error");
      return;
    }
    setComments(data.comments);
    setIgStats(data.stats ?? null);
    setIgState("ready");
  }

  useEffect(() => {
    if (instagramUsername !== null) loadComments();
  }, [instagramUsername]);

  const isClient = (text: string) =>
    brandNames.some((name) => name.length > 2 && text.toLowerCase().includes(name.toLowerCase()));

  const items: Item[] = [
    ...messages.map<Item>((msg) => ({ kind: "form", id: msg.id, date: msg.createdAt, pending: !msg.repliedAt, msg })),
    ...comments.map<Item>((comment) => ({ kind: "ig", id: comment.id, date: comment.timestamp, pending: !comment.replied, comment })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const visible = items.filter((item) =>
    filter === "all" ? true : filter === "pending" ? item.pending : filter === "form" ? item.kind === "form" : item.kind === "ig"
  );
  const counts = {
    all: items.length,
    pending: items.filter((i) => i.pending).length,
    form: messages.length,
    instagram: comments.length,
  };
  const chips: { id: Filter; label: string; show: boolean }[] = [
    { id: "all", label: "Todas", show: true },
    { id: "pending", label: "Por responder", show: true },
    { id: "form", label: "Formulario", show: true },
    { id: "instagram", label: "Instagram", show: instagramUsername !== null },
  ];

  async function patchMessage(id: string, body: { read?: boolean; replied?: boolean }) {
    const response = await fetch(`${MESSAGES_API}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      showToast("error", "No se pudo actualizar el mensaje");
      return false;
    }
    const updated = await response.json();
    setMessages((current) =>
      current.map((m) =>
        m.id === id ? { ...m, read: updated.read, repliedAt: updated.repliedAt ? String(updated.repliedAt) : null } : m
      )
    );
    router.refresh(); // actualiza el contador del menú
    return true;
  }

  function toggleReply(item: Item) {
    const next = openReply === item.id ? null : item.id;
    setOpenReply(next);
    if (next && item.kind === "form" && !item.msg.read) patchMessage(item.id, { read: true });
  }

  async function sendEmail(msg: InboxMessage) {
    const draft = (drafts[msg.id] ?? "").trim();
    const subject = `Re: Colaboración con ${msg.brand}`;
    const body = `Hola ${msg.name.split(" ")[0]},\n\n${draft}\n\n— ${signature}`;
    window.location.href = `mailto:${msg.email}?${new URLSearchParams({ subject, body }).toString().replace(/\+/g, "%20")}`;
    if (await patchMessage(msg.id, { replied: true })) {
      setOpenReply(null);
      showToast("success", "Se abrió tu correo y el mensaje quedó como respondido");
    }
  }

  async function sendComment(comment: InboxComment) {
    const message = (drafts[comment.id] ?? "").trim();
    if (!message) return showToast("error", "Escribe una respuesta");
    setBusy(comment.id);
    const response = await fetch(`${IG_API}/${comment.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reply", message }),
    });
    setBusy(null);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? "Instagram no aceptó la respuesta");
    setComments((current) =>
      current.map((c) =>
        c.id === comment.id
          ? {
              ...c,
              replied: true,
              replies: [...c.replies, { id: data.replyId, text: message, username: instagramUsername ?? "", timestamp: new Date().toISOString() }],
            }
          : c
      )
    );
    setDrafts((d) => ({ ...d, [comment.id]: "" }));
    setOpenReply(null);
    showToast("success", "Respuesta publicada en Instagram");
  }

  async function toggleHidden(comment: InboxComment) {
    setBusy(comment.id);
    const response = await fetch(`${IG_API}/${comment.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hide", hide: !comment.hidden }),
    });
    setBusy(null);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? "No se pudo cambiar el comentario");
    setComments((current) => current.map((c) => (c.id === comment.id ? { ...c, hidden: !c.hidden } : c)));
    showToast("success", comment.hidden ? "Comentario visible de nuevo" : "Comentario oculto");
  }

  async function remove(item: Item) {
    setDeleting(null);
    const response = await fetch(item.kind === "form" ? `${MESSAGES_API}/${item.id}` : `${IG_API}/${item.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? "No se pudo borrar");
    if (item.kind === "form") {
      setMessages((current) => current.filter((m) => m.id !== item.id));
      router.refresh();
    } else {
      setComments((current) => current.filter((c) => c.id !== item.id));
    }
    showToast("success", "Borrado");
  }

  return (
    <div className="flex flex-col gap-sp-4">
      <div className="flex flex-wrap gap-sp-2">
        {chips
          .filter((chip) => chip.show)
          .map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`rounded-full px-sp-4 py-[7px] text-xs font-semibold transition ${
                filter === chip.id ? "bg-ink text-cream" : "border border-line bg-white text-ink hover:border-coral"
              }`}
            >
              {chip.label} <span className="font-mono opacity-60">{counts[chip.id]}</span>
            </button>
          ))}
      </div>

      {igState === "off" && (
        <Card className="flex flex-wrap items-center justify-between gap-sp-3 text-sm text-ink/70">
          <span>Conecta Instagram para ver y responder los comentarios de tus publicaciones aquí mismo.</span>
          <Link href="/admin/conectar" className={accentLinkClass}>
            Conectar Instagram →
          </Link>
        </Card>
      )}
      {igState === "loading" && <p className="text-sm text-ink/55">Cargando comentarios de Instagram…</p>}
      {igState === "error" && (
        <Card className="flex flex-wrap items-center justify-between gap-sp-3 border-coral/40 text-sm text-ink/70">
          <span>Instagram: {igError}</span>
          <button type="button" onClick={loadComments} className={accentLinkClass}>
            Reintentar
          </button>
        </Card>
      )}

      {igState === "ready" && comments.length === 0 && igStats && igStats.reported > igStats.own && (
        <Card className="border-coral/40 text-sm text-ink/70">
          Instagram dice que tus publicaciones recientes tienen {igStats.reported} comentario{igStats.reported === 1 ? "" : "s"}, pero no
          entregó ninguno de otras cuentas. Mientras la app de Meta esté en <strong>modo desarrollo</strong>, solo llegan los comentarios de
          cuentas agregadas como evaluadoras (Instagram testers); cuando Meta apruebe la app, aparecerán los de cualquier persona.
          {igStats.own > 0 && ` (${igStats.own} son tuyos y no se muestran aquí.)`}
        </Card>
      )}

      <Card>
        {visible.length === 0 ? (
          <p className="text-sm text-ink/60">
            {filter === "pending" ? "¡Todo respondido! No tienes nada pendiente. 🎉" : "Todavía no hay mensajes aquí."}
          </p>
        ) : (
          <ul className="flex flex-col gap-sp-3">
            {visible.map((item) => {
              const isForm = item.kind === "form";
              const name = isForm ? `${item.msg.name} — ${item.msg.brand}` : igName(item.comment.username);
              const text = isForm ? item.msg.message : item.comment.text;
              const client = isClient(isForm ? item.msg.brand : `${item.comment.username} ${item.comment.text}`);
              const unread = isForm && !item.msg.read;
              const overdue = isForm && item.pending && hoursSince(item.date) >= 24;
              const replyOpen = openReply === item.id;
              const quickReplies = isForm ? formReplies(kitUrl) : COMMENT_REPLIES;
              return (
                <li
                  key={`${item.kind}-${item.id}`}
                  className={`rounded-[14px] border p-sp-3 ${unread ? "border-coral/50 bg-coral/[0.03]" : "border-line"}`}
                >
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-sp-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-sp-2">
                      <SourceBadge kind={item.kind} />
                      <span className="truncate text-[13px] font-semibold text-ink">{name}</span>
                      {client && (
                        <span className="rounded-full bg-lime/40 px-[7px] py-0.5 font-mono text-[9px] uppercase text-ink">Cliente</span>
                      )}
                      {unread && (
                        <span className="rounded-full bg-coral px-[7px] py-0.5 font-mono text-[9px] uppercase text-white">Nuevo</span>
                      )}
                      <span className="text-[11px] text-ink/55">{timeAgo(item.date)}</span>
                    </div>
                    <span className={`font-mono text-[11px] uppercase ${item.pending ? "text-coral" : "text-cobalt"}`}>
                      {item.pending ? "Pendiente" : "Respondido"}
                    </span>
                  </div>

                  {isForm ? (
                    <p className="mb-1.5 font-mono text-[11px] text-moss">
                      {item.msg.email} · {item.msg.collaborationType}
                    </p>
                  ) : (
                    <p className="mb-1.5 text-[11px] text-ink/55">
                      En:{" "}
                      {item.comment.media.permalink ? (
                        <a href={item.comment.media.permalink} target="_blank" rel="noreferrer" className="underline hover:text-coral">
                          {item.comment.media.caption || "tu publicación"}
                        </a>
                      ) : (
                        item.comment.media.caption || "tu publicación"
                      )}
                      {item.comment.likeCount > 0 && ` · ♥ ${item.comment.likeCount}`}
                      {item.comment.hidden && " · Oculto (solo lo ven tú y quien lo escribió)"}
                    </p>
                  )}

                  <p className={`whitespace-pre-line text-[13px] ${!isForm && item.comment.hidden ? "text-ink/45" : "text-ink/80"}`}>{text}</p>

                  {!isForm && item.comment.replies.length > 0 && (
                    <ul className="mt-sp-2 flex flex-col gap-1 border-l-2 border-lime pl-sp-3">
                      {item.comment.replies.slice(-2).map((reply) => (
                        <li key={reply.id} className="text-[12px] text-ink/65">
                          <strong className="text-ink">{igName(reply.username)}</strong> {reply.text}
                        </li>
                      ))}
                    </ul>
                  )}

                  {overdue && (
                    <p className="mt-sp-2 text-[11px] text-coral">
                      Lleva más de 24 h sin respuesta. Las marcas suelen quedarse con quien contesta primero.
                    </p>
                  )}

                  {replyOpen && (
                    <div className="mt-sp-3">
                      <div className="mb-sp-2 flex flex-wrap gap-1.5">
                        {quickReplies.map((qr) => (
                          <button
                            key={qr}
                            type="button"
                            onClick={() => setDrafts((d) => ({ ...d, [item.id]: qr }))}
                            className="max-w-full truncate rounded-full border border-line bg-cream px-sp-3 py-[5px] text-[11px] text-ink hover:border-coral"
                          >
                            {qr.length > 60 ? `${qr.slice(0, 57)}…` : qr}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col gap-sp-2 sm:flex-row">
                        <textarea
                          rows={isForm ? 3 : 1}
                          value={drafts[item.id] ?? ""}
                          onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                          placeholder={isForm ? "Escribe tu respuesta (se abre en tu correo)…" : "Escribe una respuesta…"}
                          className={`${inputClass} flex-1 text-[13px]`}
                        />
                        <button
                          type="button"
                          disabled={busy === item.id}
                          onClick={() => (isForm ? sendEmail(item.msg) : sendComment(item.comment))}
                          className="self-end rounded-full bg-cobalt px-sp-4 py-sp-2 text-xs font-semibold text-cream disabled:opacity-50"
                        >
                          {busy === item.id ? "Enviando…" : isForm ? "Abrir en mi correo" : "Responder en Instagram"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-sp-2 flex flex-wrap items-center gap-x-sp-4 gap-y-1 text-xs">
                    <button type="button" onClick={() => toggleReply(item)} className="font-semibold text-moss hover:underline">
                      {replyOpen ? "Cancelar" : item.pending ? "Responder" : "Responder de nuevo"}
                    </button>
                    {isForm ? (
                      <>
                        <button
                          type="button"
                          onClick={() => patchMessage(item.id, { replied: item.pending })}
                          className="text-ink/60 hover:text-ink"
                        >
                          {item.pending ? "Marcar respondido" : "Marcar pendiente"}
                        </button>
                        <button type="button" onClick={() => patchMessage(item.id, { read: !item.msg.read })} className="text-ink/60 hover:text-ink">
                          {item.msg.read ? "Marcar no leído" : "Marcar leído"}
                        </button>
                      </>
                    ) : (
                      <button type="button" disabled={busy === item.id} onClick={() => toggleHidden(item.comment)} className="text-ink/60 hover:text-ink">
                        {item.comment.hidden ? "Mostrar" : "Ocultar"}
                      </button>
                    )}
                    <button type="button" onClick={() => setDeleting(item)} className="text-ink/40 hover:text-ink">
                      Borrar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="text-xs text-ink/50">
        Mensajes directos (DM) de Instagram y Facebook: próximamente. Requieren la revisión de la app por parte de Meta, y la red
        solo deja responder dentro de las 24 h siguientes al último mensaje.
      </p>

      {deleting && (
        <ConfirmDialog
          title={deleting.kind === "form" ? "Borrar mensaje" : "Borrar comentario"}
          description={
            deleting.kind === "form"
              ? "¿Seguro que quieres borrar este mensaje del formulario?"
              : "Se borrará el comentario de tu publicación en Instagram. No se puede deshacer."
          }
          onConfirm={() => remove(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
