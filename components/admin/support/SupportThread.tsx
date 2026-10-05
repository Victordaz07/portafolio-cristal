// Conversación de un ticket. En modo equipo se ven también las notas internas.

export type ThreadMessage = {
  id: string;
  body: string;
  fromTeam: boolean;
  internal: boolean;
  authorName: string | null;
  authorEmail: string;
  createdAt: Date;
};

const fmt = (d: Date) => d.toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function SupportThread({ messages, viewer }: { messages: ThreadMessage[]; viewer: "customer" | "team" }) {
  return (
    <ol className="flex flex-col gap-sp-3">
      {messages.map((m) => {
        const mine = viewer === "team" ? m.fromTeam : !m.fromTeam;
        const who = m.fromTeam
          ? viewer === "customer"
            ? `${m.authorName || "Equipo"} · Equipo Foliocrew`
            : `${m.authorName || m.authorEmail} (equipo)`
          : m.authorName || m.authorEmail;
        return (
          <li
            key={m.id}
            className={`max-w-[92%] rounded-[16px] border px-sp-4 py-sp-3 ${
              m.internal
                ? "self-stretch border-dashed border-lime bg-lime/15"
                : mine
                  ? "self-end border-coral/20 bg-coral/5"
                  : "self-start border-line bg-white"
            }`}
          >
            <p className="mb-sp-1 flex flex-wrap items-center gap-x-sp-2 text-xs text-ink/60">
              <strong className="text-ink">{who}</strong>
              <span>{fmt(m.createdAt)}</span>
              {m.internal && <span className="rounded-full bg-lime px-[6px] font-mono text-[10px] uppercase text-ink">Nota interna</span>}
            </p>
            <p className="whitespace-pre-wrap text-sm text-ink">{m.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
