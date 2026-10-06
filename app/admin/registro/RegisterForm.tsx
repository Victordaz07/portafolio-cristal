"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/admin/AdminLang";

const inputClass = "rounded-sm border border-line px-sp-3 py-sp-2 text-ink outline-none focus:border-coral";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export default function RegisterForm({ rootDomain, refCode }: { rootDomain: string; refCode: string | null }) {
  const { t } = useT();
  const router = useRouter();
  const [values, setValues] = useState({ name: "", slug: "", email: "", password: "", inviteCode: "" });
  const [slugEdited, setSlugEdited] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => {
      const next = { ...v, [key]: value };
      if (key === "name" && !slugEdited) next.slug = slugify(value);
      return next;
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    const response = await fetch("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, ...(refCode ? { ref: refCode } : {}) }),
    });
    if (response.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }
    const data = await response.json().catch(() => ({}));
    setError(data.error ?? t("No se pudo crear la cuenta", "Couldn't create the account"));
    setStatus("idle");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sp-4">
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">{t("Tu nombre", "Your name")}</span>
        <input required value={values.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" className={inputClass} />
      </label>
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">{t("Nombre de tu sitio", "Your site name")}</span>
        <div className="flex items-center overflow-hidden rounded-sm border border-line focus-within:border-coral">
          <input
            required
            value={values.slug}
            onChange={(e) => {
              setSlugEdited(true);
              set("slug", slugify(e.target.value));
            }}
            className="min-w-0 flex-1 px-sp-3 py-sp-2 text-ink outline-none"
            aria-describedby="slug-ayuda"
          />
          <span className="shrink-0 bg-cream px-sp-2 py-sp-2 font-mono text-xs text-ink/60">.{rootDomain}</span>
        </div>
        <span id="slug-ayuda" className="text-xs text-ink/50">
          {t("Será la dirección de tu portafolio. Más adelante puedes conectar tu propio dominio.", "This will be your portfolio address. You can connect your own domain later.")}
        </span>
      </label>
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">{t("Correo", "Email")}</span>
        <input type="email" required value={values.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-sp-1">
        <span className="text-sm font-medium text-ink">{t("Contraseña", "Password")}</span>
        <input type="password" required minLength={8} value={values.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" className={inputClass} />
        <span className="text-xs text-ink/50">{t("Mínimo 8 caracteres.", "At least 8 characters.")}</span>
      </label>
      {!refCode && (
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("Código de invitación", "Invite code")}</span>
          <input required value={values.inviteCode} onChange={(e) => set("inviteCode", e.target.value)} className={inputClass} />
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-sp-2 rounded-sm bg-coral py-sp-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "loading" ? t("Creando tu espacio…", "Creating your space…") : t("Crear mi cuenta", "Create my account")}
      </button>
    </form>
  );
}
