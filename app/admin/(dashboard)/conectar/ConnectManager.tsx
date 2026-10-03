"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastContext";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { formatShortDate, daysUntil } from "@/lib/crm";
import type { PlatformId, RecentItem, SocialProfile } from "@/lib/social/types";

export interface PlatformCard {
  id: PlatformId;
  label: string;
  configured: boolean;
  missingEnv: string[];
  envKeys: string[];
  redirectUri: string;
  consoleUrl: string;
  scopes: string[];
  can: string[];
  later: string[];
  cannot: string[];
  account: {
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    followers: number | null;
    expiresAt: string | null;
    scopes: string[];
    connectedAt: string;
    lastSyncAt: string | null;
    lastError: string | null;
  } | null;
}

export interface SetupItem {
  key: string;
  ok: boolean;
  help: string;
  optional?: boolean;
}

interface TestResult {
  ok: boolean;
  refreshed?: boolean;
  profile?: SocialProfile;
  recent?: RecentItem[];
  error?: string;
}

interface AiResult {
  ok: boolean;
  model?: string;
  sample?: string;
  ms?: number;
  usage?: { input: number; output: number };
  error?: string;
}

const BADGES: Record<PlatformId, { initials: string; className: string }> = {
  instagram: { initials: "IG", className: "bg-coral text-white" },
  tiktok: { initials: "TK", className: "bg-ink text-white" },
  youtube: { initials: "YT", className: "bg-cobalt text-white" },
  facebook: { initials: "FB", className: "bg-moss text-white" },
};

const eyebrowClass = "font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55";

function formatCount(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("es-ES");
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Sin permiso de portapapeles: el texto sigue visible para copiarlo a mano.
        }
      }}
      className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-ink/70 hover:border-coral hover:text-coral"
    >
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

function StatusPill({ card }: { card: PlatformCard }) {
  if (card.account) {
    return card.account.lastError ? (
      <span className="rounded-full bg-coral/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-coral">
        Con error
      </span>
    ) : (
      <span className="rounded-full bg-sage/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-cobalt">
        Conectada
      </span>
    );
  }
  if (!card.configured) {
    return (
      <span className="rounded-full bg-ink/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink/60">
        Sin configurar
      </span>
    );
  }
  return (
    <span className="rounded-full bg-lime/35 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink">
      Lista para conectar
    </span>
  );
}

export default function ConnectManager({
  cards,
  setup,
  ai,
  flash,
  domainMismatch,
  reviewUrls,
}: {
  cards: PlatformCard[];
  setup: SetupItem[];
  ai: { configured: boolean; model: string };
  flash: { connected: string | null; error: string | null };
  domainMismatch: { appUrl: string; currentOrigin: string } | null;
  reviewUrls: { label: string; url: string }[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [results, setResults] = useState<Partial<Record<PlatformId, TestResult>>>({});
  const [testing, setTesting] = useState<PlatformId | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<PlatformCard | null>(null);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiTesting, setAiTesting] = useState(false);
  const encryptionReady = setup.find((item) => item.key === "TOKEN_ENCRYPTION_KEY")?.ok ?? false;
  const connectedLabel = cards.find((card) => card.id === flash.connected)?.label;

  async function runTest(card: PlatformCard) {
    setTesting(card.id);
    try {
      const response = await fetch(`/api/admin/connect/${card.id}/test`, { method: "POST" });
      const result: TestResult = await response.json();
      setResults((current) => ({ ...current, [card.id]: result }));
      showToast(result.ok ? "success" : "error", result.ok ? `${card.label} respondió bien` : `${card.label}: falló la prueba`);
      router.refresh();
    } catch {
      showToast("error", "No se pudo hacer la prueba");
    } finally {
      setTesting(null);
    }
  }

  async function disconnect(card: PlatformCard) {
    setConfirmDisconnect(null);
    const response = await fetch(`/api/admin/connect/${card.id}`, { method: "DELETE" });
    if (!response.ok) {
      showToast("error", "No se pudo desconectar");
      return;
    }
    setResults((current) => ({ ...current, [card.id]: undefined }));
    showToast("success", `${card.label} desconectada`);
    router.refresh();
  }

  async function runAiTest() {
    setAiTesting(true);
    try {
      const response = await fetch("/api/admin/ai/test", { method: "POST" });
      setAiResult(await response.json());
    } catch {
      setAiResult({ ok: false, error: "No se pudo contactar al servidor" });
    } finally {
      setAiTesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-sp-5">
      {connectedLabel && (
        <p className="rounded-[14px] bg-sage/30 px-sp-4 py-sp-3 text-sm font-semibold text-cobalt">
          ✓ {connectedLabel} quedó conectada. Toca “Probar” para ver qué devuelve la API.
        </p>
      )}
      {flash.error && (
        <p className="rounded-[14px] bg-coral/15 px-sp-4 py-sp-3 text-sm font-semibold text-moss">
          No se pudo conectar — {flash.error}
        </p>
      )}

      {domainMismatch && (
        <p className="rounded-[14px] bg-lime/35 px-sp-4 py-sp-3 text-sm text-ink">
          <strong>Ojo:</strong> estás en <code className="font-mono text-xs">{domainMismatch.currentOrigin}</code>, pero{" "}
          <code className="font-mono text-xs">APP_URL</code> es{" "}
          <code className="font-mono text-xs">{domainMismatch.appUrl}</code>. Para conectar, abre el panel desde{" "}
          <a href={`${domainMismatch.appUrl}/admin/conectar`} className="font-semibold text-coral hover:underline">
            {domainMismatch.appUrl}
          </a>
          ; si no, la red te devolverá a una dirección donde no tienes la sesión iniciada.
        </p>
      )}

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Configuración general</p>
        <ul className="flex flex-col gap-sp-3">
          {setup.map((item) => (
            <li key={item.key} className="flex gap-sp-3 text-sm">
              <span
                aria-hidden
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  item.ok ? "bg-sage/50 text-cobalt" : item.optional ? "bg-lime/40 text-ink" : "bg-coral/20 text-coral"
                }`}
              >
                {item.ok ? "✓" : item.optional ? "!" : "✕"}
              </span>
              <div>
                <code className="font-mono text-[13px] font-bold text-ink">{item.key}</code>
                {!item.ok && (
                  <span className="ml-sp-2 text-xs text-ink/50">{item.optional ? "recomendada" : "falta"}</span>
                )}
                <p className="text-[13px] text-ink/60">{item.help}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-sp-4 text-xs text-ink/50">
          Las variables se agregan en Vercel → tu proyecto → Settings → Environment Variables, y luego hay que
          volver a desplegar. La guía paso a paso está en <code>docs/conectar-cuentas.md</code>.
        </p>
      </Card>

      <Card>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">URLs para las apps de cada red</p>
        <p className="mt-sp-1 text-[13px] text-ink/60">
          Meta, TikTok y Google piden estas páginas al crear la app y para aprobarla. Van en inglés (
          <code className="font-mono text-xs">?lang=en</code>) porque los revisores leen en inglés; en tu sitio se ven en
          español.
        </p>
        <ul className="mt-sp-3 flex flex-col gap-sp-2">
          {reviewUrls.map((item) => (
            <li key={item.label} className="flex flex-col gap-sp-1 sm:flex-row sm:items-center sm:gap-sp-3">
              <span className="text-[13px] font-semibold text-ink sm:w-60 sm:shrink-0">{item.label}</span>
              <div className="flex min-w-0 flex-1 items-center gap-sp-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate rounded-[10px] border border-line bg-white px-sp-3 py-sp-2 font-mono text-[11px] text-ink hover:border-coral"
                >
                  {item.url}
                </a>
                <CopyButton value={item.url} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-col gap-sp-4">
        {cards.map((card) => {
          const badge = BADGES[card.id];
          const result = results[card.id];
          const account = card.account;
          const expiresIn = account?.expiresAt ? daysUntil(account.expiresAt) : null;
          return (
            <Card key={card.id} className="flex flex-col gap-sp-4">
              <div className="flex items-start justify-between gap-sp-3">
                <div className="flex items-center gap-sp-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-[10px] font-mono text-xs font-bold ${badge.className}`}
                  >
                    {badge.initials}
                  </span>
                  <h2 className="font-fraunces text-[22px] font-semibold text-ink">{card.label}</h2>
                </div>
                <StatusPill card={card} />
              </div>

              {account ? (
                <div className="flex items-center gap-sp-3 rounded-[14px] bg-cream px-sp-4 py-sp-3">
                  {account.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={account.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="h-10 w-10 rounded-full bg-lime/40" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {account.displayName && account.username
                        ? `${account.displayName} · @${account.username.replace(/^@/, "")}`
                        : account.username
                          ? `@${account.username.replace(/^@/, "")}`
                          : account.displayName ?? "Cuenta conectada"}
                    </p>
                    <p className="text-xs text-ink/60">
                      {formatCount(account.followers)} seguidores · conectada el {formatShortDate(account.connectedAt)}
                      {expiresIn != null && ` · token vence ${expiresIn <= 0 ? "ya (se renueva al probar)" : `en ${expiresIn}d`}`}
                    </p>
                    {account.lastError && <p className="mt-1 text-xs font-semibold text-coral">Último error: {account.lastError}</p>}
                  </div>
                </div>
              ) : !card.configured ? (
                <div className="rounded-[14px] bg-cream px-sp-4 py-sp-3 text-[13px] text-ink/70">
                  Faltan estas variables de entorno:{" "}
                  {card.missingEnv.map((key) => (
                    <code key={key} className="mr-1 rounded bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-ink">
                      {key}
                    </code>
                  ))}
                </div>
              ) : null}

              <div>
                <p className={eyebrowClass}>URL de redirección (cópiala en la consola de {card.label})</p>
                <div className="mt-sp-1 flex items-center gap-sp-2">
                  <code className="min-w-0 flex-1 truncate rounded-[10px] border border-line bg-white px-sp-3 py-sp-2 font-mono text-[11px] text-ink">
                    {card.redirectUri}
                  </code>
                  <CopyButton value={card.redirectUri} />
                </div>
                <p className="mt-sp-1 text-[11px] text-ink/45">
                  Permisos que se piden: {card.scopes.map((s) => s.replace("https://www.googleapis.com/auth/", "")).join(", ")} ·{" "}
                  <a href={card.consoleUrl} target="_blank" rel="noreferrer" className="text-coral hover:underline">
                    Abrir consola ↗
                  </a>
                </p>
              </div>

              <div className="grid gap-sp-3 sm:grid-cols-3">
                <div>
                  <p className={eyebrowClass}>Ya funciona</p>
                  <ul className="mt-sp-1 flex flex-col gap-1 text-[13px] text-ink/80">
                    {card.can.map((line) => (
                      <li key={line}>✓ {line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={eyebrowClass}>Posible más adelante</p>
                  <ul className="mt-sp-1 flex flex-col gap-1 text-[13px] text-ink/70">
                    {card.later.map((line) => (
                      <li key={line}>◷ {line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={eyebrowClass}>No se puede</p>
                  <ul className="mt-sp-1 flex flex-col gap-1 text-[13px] text-ink/60">
                    {card.cannot.map((line) => (
                      <li key={line}>✕ {line}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap gap-sp-2">
                {card.configured && encryptionReady ? (
                  // Navegación completa (no fetch): la red muestra su propia pantalla de login.
                  <a href={`/api/admin/connect/${card.id}/start`} className={account ? secondaryButtonClass : primaryButtonClass}>
                    {account ? "Volver a conectar" : `Conectar ${card.label}`}
                  </a>
                ) : (
                  <span className={`${secondaryButtonClass} cursor-not-allowed opacity-50`}>
                    {card.configured ? "Falta TOKEN_ENCRYPTION_KEY" : "Configura las variables primero"}
                  </span>
                )}
                {account && (
                  <>
                    <button
                      type="button"
                      onClick={() => runTest(card)}
                      disabled={testing === card.id}
                      className={primaryButtonClass}
                    >
                      {testing === card.id ? "Probando…" : "Probar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDisconnect(card)}
                      className="px-sp-2 text-sm font-medium text-ink/50 hover:text-ink"
                    >
                      Desconectar
                    </button>
                  </>
                )}
              </div>

              {result && <TestResultView result={result} />}
            </Card>
          );
        })}
      </div>

      <Card className="flex flex-col gap-sp-4">
        <div className="flex items-start justify-between gap-sp-3">
          <div className="flex items-center gap-sp-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-lime text-sm font-bold text-ink">
              ✦
            </span>
            <div>
              <h2 className="font-fraunces text-[22px] font-semibold text-ink">IA (Claude)</h2>
              <p className="text-xs text-ink/55">Para “Sugerir con IA” en Crear publicación · modelo {ai.model}</p>
            </div>
          </div>
          {ai.configured ? (
            <span className="rounded-full bg-sage/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-cobalt">
              Configurada
            </span>
          ) : (
            <span className="rounded-full bg-ink/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink/60">
              Sin configurar
            </span>
          )}
        </div>
        {!ai.configured && (
          <p className="text-[13px] text-ink/70">
            Falta <code className="font-mono font-bold">ANTHROPIC_API_KEY</code>. Créala en{" "}
            <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noreferrer" className="text-coral hover:underline">
              platform.claude.com ↗
            </a>{" "}
            y agrégala en Vercel.
          </p>
        )}
        <div>
          <button type="button" onClick={runAiTest} disabled={!ai.configured || aiTesting} className={primaryButtonClass}>
            {aiTesting ? "Probando…" : "Probar IA"}
          </button>
        </div>
        {aiResult &&
          (aiResult.ok ? (
            <div className="rounded-[14px] bg-ink p-sp-4 text-cream">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-lime">Respuesta de prueba</p>
              <p className="mt-sp-2 font-fraunces text-lg italic">{aiResult.sample}</p>
              <p className="mt-sp-2 text-xs text-cream/60">
                {aiResult.model} · {aiResult.ms} ms · {aiResult.usage?.input} tokens de entrada / {aiResult.usage?.output} de salida
              </p>
            </div>
          ) : (
            <p className="rounded-[14px] bg-coral/15 px-sp-4 py-sp-3 text-sm font-semibold text-moss">{aiResult.error}</p>
          ))}
      </Card>

      {confirmDisconnect && (
        <ConfirmDialog
          title={`Desconectar ${confirmDisconnect.label}`}
          description="Se borran los tokens guardados. Para quitar el permiso por completo, revócalo también desde la configuración de la red."
          confirmLabel="Desconectar"
          onConfirm={() => disconnect(confirmDisconnect)}
          onCancel={() => setConfirmDisconnect(null)}
        />
      )}
    </div>
  );
}

function TestResultView({ result }: { result: TestResult }) {
  if (!result.ok) {
    return (
      <div className="rounded-[14px] bg-coral/15 px-sp-4 py-sp-3 text-sm text-moss">
        <p className="font-semibold">La API respondió con error</p>
        <p className="mt-1 break-words font-mono text-xs">{result.error}</p>
      </div>
    );
  }
  const profile = result.profile;
  return (
    <div className="rounded-[14px] bg-ink p-sp-4 text-cream">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-lime">
        Respuesta de la API{result.refreshed ? " · token renovado" : ""}
      </p>
      {profile && (
        <div className="mt-sp-2 grid grid-cols-2 gap-sp-3 sm:grid-cols-4">
          <div>
            <p className="font-fraunces text-xl font-semibold">{formatCount(profile.followers)}</p>
            <p className="text-[11px] text-cream/60">Seguidores</p>
          </div>
          {Object.entries(profile.extra).map(([label, value]) => (
            <div key={label}>
              <p className="truncate font-fraunces text-xl font-semibold">
                {typeof value === "number" ? formatCount(value) : value ?? "—"}
              </p>
              <p className="text-[11px] text-cream/60">{label}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-sp-4 font-mono text-[10px] uppercase tracking-[0.12em] text-lime">
        Publicaciones recientes ({result.recent?.length ?? 0})
      </p>
      {result.recent && result.recent.length > 0 ? (
        <ul className="mt-sp-2 flex flex-col gap-sp-2">
          {result.recent.map((item) => (
            <li key={item.id} className="flex items-center gap-sp-3">
              {item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnailUrl} alt="" className="h-10 w-10 shrink-0 rounded-[8px] object-cover" />
              ) : (
                <span className="h-10 w-10 shrink-0 rounded-[8px] bg-cream/10" />
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={item.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-[13px] font-semibold hover:underline"
                >
                  {item.title || "(sin texto)"}
                </a>
                <p className="text-[11px] text-cream/60">
                  {[
                    item.publishedAt ? formatShortDate(item.publishedAt) : null,
                    ...Object.entries(item.metrics).map(([label, value]) => `${formatCount(value)} ${label.toLowerCase()}`),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-sp-2 text-[13px] text-cream/60">La API no devolvió publicaciones.</p>
      )}
    </div>
  );
}
