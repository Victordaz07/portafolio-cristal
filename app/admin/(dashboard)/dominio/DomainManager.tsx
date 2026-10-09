"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import type { DomainState } from "@/lib/domains";
import { useT } from "@/components/admin/AdminLang";

const eyebrow = "mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

function CopyButton({ text }: { text: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 rounded-full border border-line px-sp-3 py-1 text-xs text-ink hover:border-coral"
    >
      {copied ? t("¡Copiado!", "Copied!") : t("Copiar", "Copy")}
    </button>
  );
}

export default function DomainManager({
  officialUrl,
  subdomain,
  subdomainLive,
  previewPath,
  apiBase = "/api/admin/domain",
}: {
  officialUrl: string;
  subdomain: string;
  subdomainLive: boolean;
  previewPath: string;
  /** La agencia (plan Crew) reutiliza este mismo componente contra /api/admin/agency/domain. */
  apiBase?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useT();
  const [state, setState] = useState<DomainState | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"save" | "check" | "remove" | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function call(method: "GET" | "PUT" | "DELETE", body?: object) {
    const response = await fetch(apiBase, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showToast("error", data.error ?? t("No se pudo completar", "Couldn't complete it"));
      return null;
    }
    setState(data as DomainState);
    return data as DomainState;
  }

  useEffect(() => {
    call("GET");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy("save");
    const result = await call("PUT", { domain: input });
    setBusy(null);
    if (result) {
      setInput("");
      showToast("success", t("Dominio guardado. Ahora configura el DNS.", "Domain saved. Now set up the DNS."));
      router.refresh();
    }
  }

  async function check() {
    setBusy("check");
    const result = await call("GET");
    setBusy(null);
    if (result?.status === "verified") {
      showToast("success", t("¡Tu dominio está conectado!", "Your domain is connected!"));
      router.refresh();
    }
  }

  async function remove() {
    setConfirmRemove(false);
    setBusy("remove");
    if (await call("DELETE")) {
      showToast("success", t("Dominio quitado", "Domain removed"));
      router.refresh();
    }
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-sp-4">
      <Card>
        <p className={eyebrow}>{t("Tu dirección para compartir", "Your address to share")}</p>
        <div className="flex flex-wrap items-center gap-sp-3">
          <a href={officialUrl} target="_blank" rel="noreferrer" className="min-w-0 break-all font-mono text-sm text-ink underline-offset-2 hover:underline">
            {officialUrl.replace(/^https?:\/\//, "")}
          </a>
          <CopyButton text={officialUrl} />
        </div>
        <p className="mt-sp-2 text-xs text-ink/55">
          {t("Úsala en tu bio, en tus correos a marcas y en tus propuestas. El media kit está en esta misma dirección + /media-kit.", "Use it in your bio, your emails to brands and your proposals. The media kit is at this same address + /media-kit.")}
        </p>
        <ul className="mt-sp-4 flex flex-col gap-sp-2 border-t border-line pt-sp-3 text-sm">
          <li className="flex flex-wrap items-center justify-between gap-sp-2">
            <span className="text-ink/70">
              {t("Subdominio de Foliocrew:", "Foliocrew subdomain:")} <span className="font-mono text-ink">{subdomain.replace(/^https?:\/\//, "")}</span>
            </span>
            <span className={`rounded-full px-[8px] py-0.5 font-mono text-[10px] uppercase ${subdomainLive ? "bg-sage/30 text-cobalt-ink" : "bg-cream text-ink/55"}`}>
              {subdomainLive ? t("Activo", "Active") : t("Se activa con el dominio de Foliocrew", "Turns on with the Foliocrew domain")}
            </span>
          </li>
          <li className="flex flex-wrap items-center justify-between gap-sp-2">
            <span className="text-ink/70">
              {t("Dirección provisional:", "Temporary address:")} <span className="font-mono text-ink">{previewPath}</span>
            </span>
            <a href={previewPath} target="_blank" rel="noreferrer" className="text-xs font-semibold text-coral hover:underline">
              {t("Abrir ↗", "Open ↗")}
            </a>
          </li>
        </ul>
      </Card>

      <Card>
        <p className={eyebrow}>{t("Tu dominio propio", "Your own domain")}</p>
        {state === null ? (
          <p className="text-sm text-ink/55">{t("Cargando…", "Loading…")}</p>
        ) : !state.domain ? (
          <form onSubmit={save} className="flex flex-col gap-sp-3">
            <p className="text-sm text-ink/70">
              {t(
                "¿Tienes (o quieres) un dominio como tunombre.com? Cómpralo donde prefieras (GoDaddy, Namecheap, Google, Hostinger…); lo pagas tú y es tuyo. Escríbelo aquí y te decimos exactamente qué configurar.",
                "Do you have (or want) a domain like yourname.com? Buy it wherever you like (GoDaddy, Namecheap, Google, Hostinger…); you pay for it and it's yours. Enter it here and we'll tell you exactly what to set up."
              )}
            </p>
            <div className="flex flex-col gap-sp-2 sm:flex-row">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("tunombre.com", "yourname.com")} className={`${inputClass} flex-1`} required />
              <button type="submit" disabled={busy === "save"} className={primaryButtonClass}>
                {busy === "save" ? t("Conectando…", "Connecting…") : t("Conectar dominio", "Connect domain")}
              </button>
            </div>
            <p className="text-xs text-ink/50">
              {t(
                "Consejo: usa el dominio con www. (por ejemplo www.tunombre.com) si tu proveedor no permite registros A en el dominio raíz.",
                "Tip: use the domain with www. (for example www.yourname.com) if your provider doesn't allow A records on the root domain."
              )}
            </p>
          </form>
        ) : (
          <div className="flex flex-col gap-sp-4">
            <div className="flex flex-wrap items-center gap-sp-3">
              <span className="font-mono text-base font-semibold text-ink">{state.domain}</span>
              <span
                className={`rounded-full px-[10px] py-0.5 font-mono text-[10px] uppercase ${
                  state.status === "verified" ? "bg-sage/30 text-cobalt-ink" : "bg-coral/10 text-coral"
                }`}
              >
                {state.status === "verified" ? t("Conectado ✓", "Connected ✓") : t("Pendiente", "Pending")}
              </span>
            </div>

            {state.status !== "verified" && (
              <>
                <div>
                  <p className="mb-sp-2 text-sm font-semibold text-ink">
                    {t("Paso 1 · En tu proveedor del dominio, agrega este registro DNS:", "Step 1 · At your domain provider, add this DNS record:")}
                  </p>
                  <div className="overflow-x-auto rounded-[12px] border border-line">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-cream font-mono text-[10px] uppercase tracking-wide text-ink/55">
                        <tr>
                          <th className="px-sp-3 py-sp-2">{t("Tipo", "Type")}</th>
                          <th className="px-sp-3 py-sp-2">{t("Nombre / Host", "Name / Host")}</th>
                          <th className="px-sp-3 py-sp-2">{t("Valor / Apunta a", "Value / Points to")}</th>
                          <th className="px-sp-3 py-sp-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {state.records.map((r) => (
                          <tr key={`${r.type}-${r.name}-${r.value}`} className="border-t border-line">
                            <td className="px-sp-3 py-sp-2 font-mono font-semibold">{r.type}</td>
                            <td className="px-sp-3 py-sp-2 font-mono">{r.name}</td>
                            <td className="break-all px-sp-3 py-sp-2 font-mono">{r.value}</td>
                            <td className="px-sp-3 py-sp-2 text-right">
                              <CopyButton text={r.value} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-sp-2 text-xs text-ink/55">
                    {t(
                      "Si ya existe un registro del mismo tipo y nombre, reemplázalo. \"@\" significa el dominio raíz (en algunos proveedores se deja vacío).",
                      "If a record with the same type and name already exists, replace it. \"@\" means the root domain (some providers leave it empty)."
                    )}
                  </p>
                </div>
                <div>
                  <p className="mb-sp-2 text-sm font-semibold text-ink">{t("Paso 2 · Espera unos minutos y comprueba:", "Step 2 · Wait a few minutes and check:")}</p>
                  <button type="button" onClick={check} disabled={busy === "check"} className={secondaryButtonClass}>
                    {busy === "check" ? t("Comprobando…", "Checking…") : t("Comprobar ahora", "Check now")}
                  </button>
                </div>
              </>
            )}

            {state.message && <p className="rounded-[10px] bg-cream px-sp-3 py-sp-2 text-sm text-ink/70">{state.message}</p>}
            {state.status === "verified" && (
              <p className="text-sm text-ink/70">
                {t("Tu sitio ya se ve en", "Your site is now live at")}{" "}
                <a href={`https://${state.domain}`} target="_blank" rel="noreferrer" className="font-semibold text-coral hover:underline">
                  https://{state.domain}
                </a>{" "}
                {t("con su certificado de seguridad (HTTPS).", "with its security certificate (HTTPS).")}
              </p>
            )}
            <button type="button" onClick={() => setConfirmRemove(true)} disabled={busy === "remove"} className="self-start text-xs text-ink/45 hover:text-ink">
              {t("Quitar dominio", "Remove domain")}
            </button>
          </div>
        )}
      </Card>

      {confirmRemove && (
        <ConfirmDialog
          title={t("Quitar dominio", "Remove domain")}
          description={t("Tu sitio dejará de verse en ese dominio (seguirá en tu dirección de Foliocrew). El dominio sigue siendo tuyo.", "Your site will stop showing on that domain (it stays at your Foliocrew address). The domain is still yours.")}
          onConfirm={remove}
          onCancel={() => setConfirmRemove(false)}
        />
      )}
    </div>
  );
}
