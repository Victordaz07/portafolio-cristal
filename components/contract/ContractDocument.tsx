import { CONTRACT_DISCLAIMER, parseContractText } from "@/lib/contracts";

export type AcceptanceRecord = { name: string; email: string; at: Date; ip: string | null; hash: string | null };

const COPY = {
  es: { accepted: "ACEPTADO", declined: "CAMBIOS PEDIDOS", record: "Constancia de aceptación", by: "Aceptado por", on: "Fecha y hora", ip: "Dirección IP", hash: "Huella del texto (SHA-256)" },
  en: { accepted: "ACCEPTED", declined: "CHANGES REQUESTED", record: "Acceptance record", by: "Accepted by", on: "Date and time", ip: "IP address", hash: "Text fingerprint (SHA-256)" },
};

/** El contrato tal como lo ve la marca (y se imprime o guarda como PDF). */
export default function ContractDocument({
  bodyText,
  language,
  status,
  acceptance,
}: {
  bodyText: string;
  language: string;
  status?: string;
  acceptance?: AcceptanceRecord | null;
}) {
  const lang = language === "en" ? "en" : "es";
  const c = COPY[lang];
  const doc = parseContractText(bodyText);
  const stamp = status === "accepted" ? c.accepted : status === "declined" ? c.declined : null;

  return (
    <article className="relative mx-auto w-full max-w-3xl rounded-[18px] border border-line bg-white p-sp-5 text-ink shadow-sm sm:p-sp-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
      {stamp && (
        <span
          className={`absolute right-sp-5 top-sp-5 rotate-6 rounded-md border-2 px-sp-3 py-1 font-mono text-sm font-bold tracking-widest sm:right-sp-8 sm:top-sp-8 ${
            status === "accepted" ? "border-moss text-moss" : "border-coral text-coral"
          }`}
        >
          {stamp}
        </span>
      )}
      <h1 className="pr-28 font-fraunces text-2xl font-semibold leading-tight sm:text-3xl">{doc.title}</h1>
      <div className="mt-sp-5 flex flex-col gap-sp-5">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{section.heading}</h2>
            <div className="mt-sp-2 flex flex-col gap-sp-2 text-[15px] leading-relaxed">
              {section.paragraphs.map((p, i) =>
                p.startsWith("- ") ? (
                  <p key={i} className="flex gap-sp-2 pl-sp-2">
                    <span aria-hidden="true">•</span>
                    <span className="min-w-0 break-words">{p.slice(2)}</span>
                  </p>
                ) : (
                  <p key={i} className="break-words">
                    {p}
                  </p>
                )
              )}
            </div>
          </section>
        ))}
      </div>

      {acceptance && (
        <section className="mt-sp-6 rounded-[14px] border border-moss/40 bg-lime/15 p-sp-4 text-sm print:border-ink/30 print:bg-transparent">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-moss">{c.record}</h2>
          <dl className="mt-sp-2 grid gap-x-sp-4 gap-y-1 sm:grid-cols-[170px_1fr]">
            <dt className="text-ink/55">{c.by}</dt>
            <dd className="break-words font-semibold">
              {acceptance.name} · {acceptance.email}
            </dd>
            <dt className="text-ink/55">{c.on}</dt>
            <dd>{acceptance.at.toLocaleString(lang === "en" ? "en-US" : "es-US", { dateStyle: "long", timeStyle: "medium", timeZone: "UTC" })} UTC</dd>
            {acceptance.ip && (
              <>
                <dt className="text-ink/55">{c.ip}</dt>
                <dd>{acceptance.ip}</dd>
              </>
            )}
            {acceptance.hash && (
              <>
                <dt className="text-ink/55">{c.hash}</dt>
                <dd className="break-all font-mono text-[11px]">{acceptance.hash}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      <p className="mt-sp-6 border-t border-line pt-sp-3 text-xs text-ink/50">{CONTRACT_DISCLAIMER[lang]}</p>
    </article>
  );
}
