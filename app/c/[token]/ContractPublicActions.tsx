"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COPY = {
  es: {
    print: "Descargar PDF / Imprimir",
    tip: "En la ventana de impresión elige «Guardar como PDF».",
    title: "¿Estás de acuerdo?",
    intro: "Lee el acuerdo completo. Para aceptarlo, escribe tu nombre y tu correo. Guardamos tu nombre, correo, fecha, hora y dirección IP como constancia, y recibes una copia por correo.",
    name: "Tu nombre completo",
    email: "Tu correo",
    agree: "He leído el acuerdo y estoy de acuerdo con sus términos.",
    accept: "Aceptar el acuerdo",
    changes: "Pedir cambios",
    reason: "¿Qué te gustaría cambiar?",
    sendChanges: "Enviar mis cambios",
    cancel: "Cancelar",
    sent: "Listo: le avisamos para que revise tus cambios.",
    error: "No se pudo enviar. Revisa los datos e intenta de nuevo.",
  },
  en: {
    print: "Download PDF / Print",
    tip: "In the print dialog, choose “Save as PDF”.",
    title: "Do you agree?",
    intro: "Read the full agreement. To accept it, type your name and email. We record your name, email, date, time and IP address as proof, and you get a copy by email.",
    name: "Your full name",
    email: "Your email",
    agree: "I have read the agreement and agree to its terms.",
    accept: "Accept the agreement",
    changes: "Ask for changes",
    reason: "What would you like to change?",
    sendChanges: "Send my changes",
    cancel: "Cancel",
    sent: "Done: we let them know so they can review your changes.",
    error: "Couldn't send. Check the details and try again.",
  },
};

/** Botón de imprimir o guardar como PDF (va arriba del documento). */
export function PrintBar({ lang }: { lang: "es" | "en" }) {
  const c = COPY[lang];
  return (
    <div className="mx-auto mb-sp-4 flex w-full max-w-3xl flex-col gap-sp-1 print:hidden">
      <div>
        <button type="button" onClick={() => window.print()} className="rounded-full bg-ink px-sp-5 py-sp-2 text-sm font-semibold text-cream hover:bg-coral">
          {c.print}
        </button>
      </div>
      <p className="text-xs text-ink/50">{c.tip}</p>
    </div>
  );
}

/** Aceptar o pedir cambios (va debajo del documento, cuando está enviado). */
export default function ContractPublicActions({ token, lang, canRespond, defaultEmail }: { token: string; lang: "es" | "en"; canRespond: boolean; defaultEmail: string }) {
  const c = COPY[lang];
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [agree, setAgree] = useState(false);
  const [mode, setMode] = useState<"accept" | "changes">("accept");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "error" | "changes-sent">("idle");

  async function send(action: "accept" | "decline", body: unknown) {
    setState("busy");
    const response = await fetch(`/api/contract/${encodeURIComponent(token)}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    if (!response?.ok) return setState("error");
    if (action === "decline") setState("changes-sent");
    router.refresh();
  }

  const input = "w-full rounded-md border border-line bg-white px-sp-3 py-sp-2.5 text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/15";
  return (
    <div className="mx-auto w-full max-w-3xl print:hidden">
      {canRespond && state !== "changes-sent" && (
        <section className="mt-sp-4 rounded-[18px] border border-line bg-white p-sp-5 sm:p-sp-6" aria-label={c.title}>
          <h2 className="font-fraunces text-xl font-semibold text-ink">{c.title}</h2>
          {mode === "accept" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send("accept", { name, email, agree });
              }}
              className="mt-sp-2 flex flex-col gap-sp-3"
            >
              <p className="text-sm text-ink/65">{c.intro}</p>
              <label className="flex flex-col gap-1 text-sm font-medium">
                {c.name}
                <input required minLength={2} maxLength={200} value={name} onChange={(e) => setName(e.target.value)} className={input} autoComplete="name" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                {c.email}
                <input required type="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="email" />
              </label>
              <label className="flex items-start gap-sp-2 text-sm">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" required />
                {c.agree}
              </label>
              <div className="flex flex-wrap items-center gap-sp-3">
                <button type="submit" disabled={state === "busy" || !agree || name.trim().length < 2} className="rounded-full bg-ink px-sp-5 py-sp-2.5 text-sm font-semibold text-cream hover:bg-coral disabled:opacity-50">
                  {c.accept}
                </button>
                <button type="button" onClick={() => setMode("changes")} className="text-sm font-semibold text-coral hover:underline">
                  {c.changes}
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send("decline", { reason });
              }}
              className="mt-sp-2 flex flex-col gap-sp-3"
            >
              <label className="flex flex-col gap-1 text-sm font-medium">
                {c.reason}
                <textarea rows={4} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} className={input} />
              </label>
              <div className="flex flex-wrap items-center gap-sp-3">
                <button type="submit" disabled={state === "busy"} className="rounded-full bg-ink px-sp-5 py-sp-2.5 text-sm font-semibold text-cream hover:bg-coral disabled:opacity-50">
                  {c.sendChanges}
                </button>
                <button type="button" onClick={() => setMode("accept")} className="text-sm text-ink/60 hover:underline">
                  {c.cancel}
                </button>
              </div>
            </form>
          )}
          {state === "error" && <p className="mt-sp-3 text-sm text-coral">{c.error}</p>}
        </section>
      )}
      {state === "changes-sent" && <p className="mt-sp-4 rounded-[14px] bg-lime/30 px-sp-4 py-sp-3 text-sm font-semibold text-moss">{c.sent}</p>}
    </div>
  );
}
