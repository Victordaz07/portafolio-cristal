"use client";

import { useState } from "react";

const COLLABORATION_TYPES = ["Sencillo", "Bundle", "Mensual", "A medida"];

export default function ContactForm() {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [email, setEmail] = useState("");
  const [collaborationType, setCollaborationType] = useState(COLLABORATION_TYPES[0]);
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
    setErrorMessage(data.error ?? "No se pudo enviar el mensaje, intenta de nuevo.");
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-sage bg-white p-sp-6 text-center">
        <p className="font-bodoni italic font-bold text-xl text-ink">¡Gracias por escribir!</p>
        <p className="mt-sp-2 text-ink/70">
          Recibí tu mensaje y te voy a responder por correo lo antes posible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
      <div className="grid gap-sp-4 sm:grid-cols-2">
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Nombre</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral"
          />
        </label>

        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Marca / empresa</span>
          <input
            required
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral"
          />
        </label>
      </div>

      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral"
        />
      </label>

      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Tipo de colaboración</span>
        <select
          value={collaborationType}
          onChange={(e) => setCollaborationType(e.target.value)}
          className="rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral"
        >
          {COLLABORATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">Mensaje</span>
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
        className="mt-sp-2 rounded-sm bg-coral text-white font-medium py-sp-3 hover:opacity-90 disabled:opacity-60 transition"
      >
        {status === "loading" ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
