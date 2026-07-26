"use client";

import { useState } from "react";
import { HeartIcon } from "@/components/icons";
import { t, type Locale } from "@/lib/i18n";

// La clave (key) es lo que se guarda en el mensaje de contacto y siempre queda en
// español, sin importar el idioma mostrado — así /admin/mensajes se lee consistente.
const COLLABORATION_TYPES = [
  { key: "Sencillo", es: "Sencillo", en: "Simple" },
  { key: "Bundle", es: "Bundle", en: "Bundle" },
  { key: "Mensual", es: "Mensual", en: "Monthly" },
  { key: "A medida", es: "A medida", en: "Custom" },
];

export default function ContactForm({ locale }: { locale: Locale }) {
  const copy = t(locale).contactForm;
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [email, setEmail] = useState("");
  const [collaborationType, setCollaborationType] = useState(COLLABORATION_TYPES[0].key);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, brand, email, collaborationType, message }),
    });

    if (response.ok) {
      setStatus("success");
      setName("");
      setBrand("");
      setEmail("");
      setMessage("");
      return;
    }

    const data = await response.json().catch(() => ({}));
    setStatus("error");
    setErrorMessage(data.error ?? copy.errorFallback);
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-sage bg-white p-sp-6 text-center">
        <p className="font-bodoni italic font-bold text-xl text-ink">{copy.successTitle}</p>
        <p className="mt-sp-2 text-ink/70">{copy.successBody}</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-md border border-lime/50 bg-white pt-sp-6 pb-sp-6 shadow-sm">
      <span className="absolute -top-sp-3 left-sp-5 inline-flex items-center gap-sp-2 rounded-full bg-cobalt px-sp-4 py-sp-1 font-mono text-[11px] uppercase tracking-widest text-cream">
        <HeartIcon className="h-3 w-3" />
        {copy.badge}
      </span>

      <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4 px-sp-5">
        <div className="grid gap-sp-4 sm:grid-cols-2">
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">{copy.nombre}</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral"
            />
          </label>

          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">{copy.marca}</span>
            <input
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral"
            />
          </label>
        </div>

        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{copy.email}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral"
          />
        </label>

        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{copy.tipo}</span>
          <select
            value={collaborationType}
            onChange={(e) => setCollaborationType(e.target.value)}
            className="rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral"
          >
            {COLLABORATION_TYPES.map((type) => (
              <option key={type.key} value={type.key}>
                {locale === "en" ? type.en : type.es}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{copy.mensaje}</span>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral"
          />
        </label>

        {status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-sp-2 rounded-full bg-coral text-white font-medium py-sp-3 hover:opacity-90 disabled:opacity-60 transition"
        >
          {status === "loading" ? copy.enviando : copy.enviar}
        </button>
      </form>
    </div>
  );
}
