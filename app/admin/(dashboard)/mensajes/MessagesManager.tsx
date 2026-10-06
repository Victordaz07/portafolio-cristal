"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { accentLinkClass, inputClass } from "@/lib/admin-ui";
import type { InboxComment } from "@/lib/social/instagram-comments";
import type { AdminLang, T } from "@/lib/admin-lang";
import { socialError } from "@/lib/social/copy-en";
import { useT } from "@/components/admin/AdminLang";

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
const COMMENT_REPLIES_EN = [
  "Thanks for your comment! 💛",
  "I'll DM you the details",
  "You can find it at the link in my bio",
  "So glad you liked it!",
];

function formReplies(mediaKitUrl: string, lang: AdminLang) {
  if (lang === "en") {
    return [
      `Thanks for reaching out! I'd love to collaborate. Here's my media kit with my numbers and packages: ${mediaKitUrl}`,
      "Could you share the brief, dates and approximate budget? That way I can put together a proposal.",
      "Thanks for thinking of me! My schedule is full right now, but I'd love to work together later on.",
    ];
  }
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
function igName(username: string, t: T) {
  return username ? `@${username}` : t("Usuario de Instagram", "Instagram user");
}

function timeAgo(date: string, t: T) {
  const hours = hoursSince(date);
  if (hours < 1) {
    const min = Math.max(1, Math.round(hours * 60));
    return t(`hace ${min} min`, `${min} min ago`);
  }
  if (hours < 24) return t(`hace ${Math.round(hours)} h`, `${Math.round(hours)} h ago`);
  return t(`hace ${Math.round(hours / 24)} d`, `${Math.round(hours / 24)} d ago`);
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
  const { t, lang } = useT();
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
      setIgError(data?.error ?? t("No se pudieron cargar los comentarios", "Couldn't load the comments"));
      setIgState("error");
      return;
    }
    setComments(data.comments);
    setIgStats(data.stats ?? null);
    setIgState("ready");
  }

  useEffect(() => {
    if (instagramUsername !== null) loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar o al cambiar la cuenta
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
    { id: "all", label: t("Todas", "All"), show: true },
    { id: "pending", label: t("Por responder", "To reply"), show: true },
    { id: "form", label: t("Formulario", "Form"), show: true },
    { id: "instagram", label: "Instagram", show: instagramUsername !== null },
  ];

  async function patchMessage(id: string, body: { read?: boolean; replied?: boolean }) {
    const response = await fetch(`${MESSAGES_API}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      showToast("error", t("No se pudo actualizar el mensaje", "Couldn't update the message"));
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
    const subject = t(`Re: Colaboración con ${msg.brand}`, `Re: Collaboration with ${msg.brand}`);
    const body = t(`Hola ${msg.name.split(" ")[0]},\n\n${draft}\n\n— ${signature}`, `Hi ${msg.name.split(" ")[0]},\n\n${draft}\n\n— ${signature}`);
    window.location.href = `mailto:${msg.email}?${new URLSearchParams({ subject, body }).toString().replace(/\+/g, "%20")}`;
    if (await patchMessage(msg.id, { replied: true })) {
      setOpenReply(null);
      showToast("success", t("Se abrió tu correo y el mensaje quedó como respondido", "Your email opened and the message was marked as replied"));
    }
  }

  async function sendComment(comment: InboxComment) {
    const message = (drafts[comment.id] ?? "").trim();
    if (!message) return showToast("error", t("Escribe una respuesta", "Write a reply"));
    setBusy(comment.id);
    const response = await fetch(`${IG_API}/${comment.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reply", message }),
    });
    setBusy(null);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? t("Instagram no aceptó la respuesta", "Instagram didn't accept the reply"));
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
    showToast("success", t("Respuesta publicada en Instagram", "Reply posted on Instagram"));
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
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo cambiar el comentario", "Couldn't change the comment"));
    setComments((current) => current.map((c) => (c.id === comment.id ? { ...c, hidden: !c.hidden } : c)));
    showToast("success", comment.hidden ? t("Comentario visible de nuevo", "Comment visible again") : t("Comentario oculto", "Comment hidden"));
  }

  async function remove(item: Item) {
    setDeleting(null);
    const response = await fetch(item.kind === "form" ? `${MESSAGES_API}/${item.id}` : `${IG_API}/${item.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo borrar", "Couldn't delete"));
    if (item.kind === "form") {
      setMessages((current) => current.filter((m) => m.id !== item.id));
      router.refresh();
    } else {
      setComments((current) => current.filter((c) => c.id !== item.id));
    }
    showToast("success", t("Borrado", "Deleted"));
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
          <span>{t("Conecta Instagram para ver y responder los comentarios de tus publicaciones aquí mismo.", "Connect Instagram to see and reply to the comments on your posts right here.")}</span>
          <Link href="/admin/conectar" className={accentLinkClass}>
            {t("Conectar Instagram →", "Connect Instagram →")}
          </Link>
        </Card>
      )}
      {igState === "loading" && <p className="text-sm text-ink/55">{t("Cargando comentarios de Instagram…", "Loading Instagram comments…")}</p>}
      {igState === "error" && (
        <Card className="flex flex-wrap items-center justify-between gap-sp-3 border-coral/40 text-sm text-ink/70">
          <span>Instagram: {socialError(lang, igError)}</span>
          <button type="button" onClick={loadComments} className={accentLinkClass}>
            {t("Reintentar", "Retry")}
          </button>
        </Card>
      )}

      {igState === "ready" && comments.length === 0 && igStats && igStats.reported > igStats.own && (
        <Card className="border-coral/40 text-sm text-ink/70">
          {t(
            `Instagram dice que tus publicaciones recientes tienen ${igStats.reported} comentario${igStats.reported === 1 ? "" : "s"}, pero no entregó ninguno de otras cuentas. Mientras la app de Meta esté en modo desarrollo, solo llegan los comentarios de cuentas agregadas como evaluadoras (Instagram testers); cuando Meta apruebe la app, aparecerán los de cualquier persona.`,
            `Instagram says your recent posts have ${igStats.reported} comment${igStats.reported === 1 ? "" : "s"}, but it didn't return any from other accounts. While the Meta app is in development mode, only comments from accounts added as Instagram testers come through; once Meta approves the app, everyone's will appear.`
          )}
          {igStats.own > 0 && t(` (${igStats.own} son tuyos y no se muestran aquí.)`, ` (${igStats.own} are yours and aren't shown here.)`)}
        </Card>
      )}

      <Card>
        {visible.length === 0 ? (
          <p className="text-sm text-ink/60">
            {filter === "pending" ? t("¡Todo respondido! No tienes nada pendiente. 🎉", "All replied! Nothing pending. 🎉") : t("Todavía no hay mensajes aquí.", "No messages here yet.")}
          </p>
        ) : (
          <ul className="flex flex-col gap-sp-3">
            {visible.map((item) => {
              const isForm = item.kind === "form";
              const name = isForm ? `${item.msg.name} — ${item.msg.brand}` : igName(item.comment.username, t);
              const text = isForm ? item.msg.message : item.comment.text;
              const client = isClient(isForm ? item.msg.brand : `${item.comment.username} ${item.comment.text}`);
              const unread = isForm && !item.msg.read;
              const overdue = isForm && item.pending && hoursSince(item.date) >= 24;
              const replyOpen = openReply === item.id;
              const quickReplies = isForm ? formReplies(kitUrl, lang) : lang === "en" ? COMMENT_REPLIES_EN : COMMENT_REPLIES;
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
                        <span className="rounded-full bg-lime/40 px-[7px] py-0.5 font-mono text-[9px] uppercase text-ink">{t("Cliente", "Client")}</span>
                      )}
                      {unread && (
                        <span className="rounded-full bg-coral px-[7px] py-0.5 font-mono text-[9px] uppercase text-white">{t("Nuevo", "New")}</span>
                      )}
                      <span className="text-[11px] text-ink/55">{timeAgo(item.date, t)}</span>
                    </div>
                    <span className={`font-mono text-[11px] uppercase ${item.pending ? "text-coral" : "text-cobalt"}`}>
                      {item.pending ? t("Pendiente", "Pending") : t("Respondido", "Replied")}
                    </span>
                  </div>

                  {isForm ? (
                    <p className="mb-1.5 font-mono text-[11px] text-moss">
                      {item.msg.email} · {item.msg.collaborationType}
                    </p>
                  ) : (
                    <p className="mb-1.5 text-[11px] text-ink/55">
                      {t("En:", "On:")}{" "}
                      {item.comment.media.permalink ? (
                        <a href={item.comment.media.permalink} target="_blank" rel="noreferrer" className="underline hover:text-coral">
                          {item.comment.media.caption || t("tu publicación", "your post")}
                        </a>
                      ) : (
                        item.comment.media.caption || t("tu publicación", "your post")
                      )}
                      {item.comment.likeCount > 0 && ` · ♥ ${item.comment.likeCount}`}
                      {item.comment.hidden && t(" · Oculto (solo lo ven tú y quien lo escribió)", " · Hidden (only you and the author can see it)")}
                    </p>
                  )}

                  <p className={`whitespace-pre-line text-[13px] ${!isForm && item.comment.hidden ? "text-ink/45" : "text-ink/80"}`}>{text}</p>

                  {!isForm && item.comment.replies.length > 0 && (
                    <ul className="mt-sp-2 flex flex-col gap-1 border-l-2 border-lime pl-sp-3">
                      {item.comment.replies.slice(-2).map((reply) => (
                        <li key={reply.id} className="text-[12px] text-ink/65">
                          <strong className="text-ink">{igName(reply.username, t)}</strong> {reply.text}
                        </li>
                      ))}
                    </ul>
                  )}

                  {overdue && (
                    <p className="mt-sp-2 text-[11px] text-coral">
                      {t("Lleva más de 24 h sin respuesta. Las marcas suelen quedarse con quien contesta primero.", "No reply for over 24 h. Brands usually go with whoever answers first.")}
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
                          placeholder={isForm ? t("Escribe tu respuesta (se abre en tu correo)…", "Write your reply (opens in your email)…") : t("Escribe una respuesta…", "Write a reply…")}
                          className={`${inputClass} flex-1 text-[13px]`}
                        />
                        <button
                          type="button"
                          disabled={busy === item.id}
                          onClick={() => (isForm ? sendEmail(item.msg) : sendComment(item.comment))}
                          className="self-end rounded-full bg-cobalt px-sp-4 py-sp-2 text-xs font-semibold text-cream disabled:opacity-50"
                        >
                          {busy === item.id ? t("Enviando…", "Sending…") : isForm ? t("Abrir en mi correo", "Open in my email") : t("Responder en Instagram", "Reply on Instagram")}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-sp-2 flex flex-wrap items-center gap-x-sp-4 gap-y-1 text-xs">
                    <button type="button" onClick={() => toggleReply(item)} className="font-semibold text-moss hover:underline">
                      {replyOpen ? t("Cancelar", "Cancel") : item.pending ? t("Responder", "Reply") : t("Responder de nuevo", "Reply again")}
                    </button>
                    {isForm ? (
                      <>
                        <button
                          type="button"
                          onClick={() => patchMessage(item.id, { replied: item.pending })}
                          className="text-ink/60 hover:text-ink"
                        >
                          {item.pending ? t("Marcar respondido", "Mark replied") : t("Marcar pendiente", "Mark pending")}
                        </button>
                        <button type="button" onClick={() => patchMessage(item.id, { read: !item.msg.read })} className="text-ink/60 hover:text-ink">
                          {item.msg.read ? t("Marcar no leído", "Mark unread") : t("Marcar leído", "Mark read")}
                        </button>
                      </>
                    ) : (
                      <button type="button" disabled={busy === item.id} onClick={() => toggleHidden(item.comment)} className="text-ink/60 hover:text-ink">
                        {item.comment.hidden ? t("Mostrar", "Show") : t("Ocultar", "Hide")}
                      </button>
                    )}
                    <button type="button" onClick={() => setDeleting(item)} className="text-ink/40 hover:text-ink">
                      {t("Borrar", "Delete")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="text-xs text-ink/50">
        {t(
          "Mensajes directos (DM) de Instagram y Facebook: próximamente. Requieren la revisión de la app por parte de Meta, y la red solo deja responder dentro de las 24 h siguientes al último mensaje.",
          "Instagram and Facebook direct messages (DMs): coming soon. They require Meta's app review, and the network only allows replies within 24 h of the last message."
        )}
      </p>

      {deleting && (
        <ConfirmDialog
          title={deleting.kind === "form" ? t("Borrar mensaje", "Delete message") : t("Borrar comentario", "Delete comment")}
          description={
            deleting.kind === "form"
              ? t("¿Seguro que quieres borrar este mensaje del formulario?", "Are you sure you want to delete this form message?")
              : t("Se borrará el comentario de tu publicación en Instagram. No se puede deshacer.", "The comment will be deleted from your Instagram post. This can't be undone.")
          }
          onConfirm={() => remove(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
