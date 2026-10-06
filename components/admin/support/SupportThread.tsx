// Conversación de un ticket. En modo equipo se ven también las notas internas.
import { dateLocale, makeT, type AdminLang } from "@/lib/admin-lang";

export type ThreadMessage = {
  id: string;
  body: string;
  fromTeam: boolean;
  internal: boolean;
  authorName: string | null;
  authorEmail: string;
  createdAt: Date;
};

const fmt = (d: Date, lang: AdminLang) => d.toLocaleString(dateLocale(lang), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function SupportThread({ messages, viewer, lang = "es" }: { messages: ThreadMessage[]; viewer: "customer" | "team"; lang?: AdminLang }) {
  const t = makeT(lang);
  return (
    <ol className="flex flex-col gap-sp-3">
      {messages.map((m) => {
        const mine = viewer === "team" ? m.fromTeam : !m.fromTeam;
        const who = m.fromTeam
          ? viewer === "customer"
            ? `${m.authorName || t("Equipo", "Team")} · ${t("Equipo Foliocrew", "Foliocrew team")}`
            : `${m.authorName || m.authorEmail} (${t("equipo", "team")})`
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
              <span>{fmt(m.createdAt, lang)}</span>
              {m.internal && <span className="rounded-full bg-lime px-[6px] font-mono text-[10px] uppercase text-ink">{t("Nota interna", "Internal note")}</span>}
            </p>
            <p className="whitespace-pre-wrap text-sm text-ink">{m.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
