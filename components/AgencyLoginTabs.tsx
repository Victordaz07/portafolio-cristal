"use client";

import { useState } from "react";
import AdminLoginForm from "@/components/AdminLoginForm";
import AgencyClientLoginForm from "@/components/AgencyClientLoginForm";
import type { Locale } from "@/lib/i18n";

/** Las dos puertas de entrada de una agencia (plan Crew): su equipo (correo+contraseña, como
 * cualquier cuenta de Foliocrew) y sus clientes (código de acceso, sin contraseña). */
export default function AgencyLoginTabs({ agencySlug, locale }: { agencySlug: string; locale: Locale }) {
  const [tab, setTab] = useState<"equipo" | "cliente">("equipo");

  return (
    <div>
      <div className="mb-sp-5 flex gap-sp-2 r-sm bg-cream p-1">
        <button
          type="button"
          onClick={() => setTab("equipo")}
          className={`flex-1 rounded-sm py-sp-2 text-sm font-medium transition ${tab === "equipo" ? "bg-white text-ink shadow-sm" : "text-ink/60"}`}
        >
          Equipo
        </button>
        <button
          type="button"
          onClick={() => setTab("cliente")}
          className={`flex-1 rounded-sm py-sp-2 text-sm font-medium transition ${tab === "cliente" ? "bg-white text-ink shadow-sm" : "text-ink/60"}`}
        >
          Soy cliente
        </button>
      </div>
      {tab === "equipo" ? <AdminLoginForm locale={locale} /> : <AgencyClientLoginForm agencySlug={agencySlug} />}
    </div>
  );
}
