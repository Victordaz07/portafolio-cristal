"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import type { ModuleKey, ModuleStage } from "@/lib/module-flags";

export interface ModuleFlagRow {
  key: ModuleKey;
  label: string;
  stage: ModuleStage;
}

const STAGE_LABEL: Record<ModuleStage, string> = { off: "Apagado", ambassadors: "Solo embajadoras", public: "Público" };

export default function ModuleFlagsManager({ modules }: { modules: ModuleFlagRow[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function changeStage(key: ModuleKey, stage: ModuleStage) {
    setBusyKey(key);
    const response = await fetch("/api/admin/platform/module-flags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, stage }),
    });
    setBusyKey(null);
    if (!response.ok) return showToast("error", "No se pudo cambiar");
    showToast("success", "Guardado");
    router.refresh();
  }

  return (
    <Card>
      <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Módulos del Mercado de creadores</p>
      <p className="mb-sp-4 text-sm text-ink/60">
        Cada pieza se libera en 3 pasos: apagada para todo el mundo, visible solo para cuentas embajadoras (para probarla primero), o pública.
      </p>
      <ul className="flex flex-col gap-sp-3">
        {modules.map((m) => (
          <li key={m.key} className="flex flex-wrap items-center justify-between gap-sp-3 border-t border-line pt-sp-3 first:border-0 first:pt-0">
            <span className="font-medium text-ink">{m.label}</span>
            <select
              value={m.stage}
              disabled={busyKey === m.key}
              onChange={(e) => changeStage(m.key, e.target.value as ModuleStage)}
              className="rounded-full border border-line bg-white px-sp-3 py-1.5 text-sm text-ink outline-none focus:border-coral"
            >
              {(Object.keys(STAGE_LABEL) as ModuleStage[]).map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABEL[stage]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </Card>
  );
}
