"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastContext";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { formatShortDate, daysUntil } from "@/lib/crm";
import type { PlatformId, RecentItem, SocialProfile } from "@/lib/social/types";
import { socialCopy, socialError } from "@/lib/social/copy-en";
import { dateLocale, type AdminLang } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

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

function formatCount(value: number | null | undefined, lang: AdminLang = "es") {
  if (value == null) return "—";
  return value.toLocaleString(dateLocale(lang));
}

function CopyButton({ value }: { value: string }) {
  const { t } = useT();
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
      {copied ? t("¡Copiado!", "Copied!") : t("Copiar", "Copy")}
    </button>
  );
}

function StatusPill({ card }: { card: PlatformCard }) {
  const { t } = useT();
  if (card.account) {
    return card.account.lastError ? (
      <span className="rounded-full bg-coral/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-coral">
        {t("Con error", "Error")}
      </span>
    ) : (
      <span className="rounded-full bg-sage/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-cobalt">
        {t("Conectada", "Connected")}
      </span>
    );
  }
  if (!card.configured) {
    return (
      <span className="rounded-full bg-ink/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink/60">
        {t("Sin configurar", "Not set up")}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-lime/35 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink">
      {t("Lista para conectar", "Ready to connect")}
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
  const { t, lang } = useT();
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
      showToast(result.ok ? "success" : "error", result.ok ? t(`${card.label} respondió bien`, `${card.label} responded OK`) : t(`${card.label}: falló la prueba`, `${card.label}: the test failed`));
      router.refresh();
    } catch {
      showToast("error", t("No se pudo hacer la prueba", "Couldn't run the test"));
    } finally {
      setTesting(null);
    }
  }

  async function disconnect(card: PlatformCard) {
    setConfirmDisconnect(null);
    const response = await fetch(`/api/admin/connect/${card.id}`, { method: "DELETE" });
    if (!response.ok) {
      showToast("error", t("No se pudo desconectar", "Couldn't disconnect"));
      return;
    }
    setResults((current) => ({ ...current, [card.id]: undefined }));
    showToast("success", t(`${card.label} desconectada`, `${card.label} disconnected`));
    router.refresh();
  }

  async function runAiTest() {
    setAiTesting(true);
    try {
      const response = await fetch("/api/admin/ai/test", { method: "POST" });
      setAiResult(await response.json());
    } catch {
      setAiResult({ ok: false, error: t("No se pudo contactar al servidor", "Couldn't reach the server") });
    } finally {
      setAiTesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-sp-5">
      {connectedLabel && (
        <p className="rounded-[14px] bg-sage/30 px-sp-4 py-sp-3 text-sm font-semibold text-cobalt">
          ✓ {t(`${connectedLabel} quedó conectada. Toca “Probar” para ver qué devuelve la API.`, `${connectedLabel} is connected. Tap “Test” to see what the API returns.`)}
        </p>
      )}
      {flash.error && (
        <p className="rounded-[14px] bg-coral/15 px-sp-4 py-sp-3 text-sm font-semibold text-moss">
          {t("No se pudo conectar", "Couldn't connect")} — {flash.error}
        </p>
      )}

      {domainMismatch && (
        <p className="rounded-[14px] bg-lime/35 px-sp-4 py-sp-3 text-sm text-ink">
          <strong>{t("Ojo:", "Heads up:")}</strong> {t("estás en", "you're on")} <code className="font-mono text-xs">{domainMismatch.currentOrigin}</code>, {t("pero", "but")}{" "}
          <code className="font-mono text-xs">APP_URL</code> {t("es", "is")}{" "}
          <code className="font-mono text-xs">{domainMismatch.appUrl}</code>. {t("Para conectar, abre el panel desde", "To connect, open the dashboard from")}{" "}
          <a href={`${domainMismatch.appUrl}/admin/conectar`} className="font-semibold text-coral hover:underline">
            {domainMismatch.appUrl}
          </a>
          {t("; si no, la red te devolverá a una dirección donde no tienes la sesión iniciada.", "; otherwise the network will send you back to an address where you aren't signed in.")}
        </p>
      )}

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Configuración general", "General setup")}</p>
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
                  <span className="ml-sp-2 text-xs text-ink/50">{item.optional ? t("recomendada", "recommended") : t("falta", "missing")}</span>
                )}
                <p className="text-[13px] text-ink/60">{item.help}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-sp-4 text-xs text-ink/50">
          {t("Las variables se agregan en Vercel → tu proyecto → Settings → Environment Variables, y luego hay que volver a desplegar. La guía paso a paso está en", "Variables are added in Vercel → your project → Settings → Environment Variables, then you redeploy. The step-by-step guide is in")}{" "}
          <code>docs/conectar-cuentas.md</code>.
        </p>
      </Card>

      <Card>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("URLs para las apps de cada red", "URLs for each network's app")}</p>
        <p className="mt-sp-1 text-[13px] text-ink/60">
          {t("Meta, TikTok y Google piden estas páginas al crear la app y para aprobarla. Van en inglés", "Meta, TikTok and Google ask for these pages when you create the app and to approve it. They're in English")} (
          <code className="font-mono text-xs">?lang=en</code>){" "}
          {t("porque los revisores leen en inglés; en tu sitio se ven en español.", "because reviewers read English; visitors can switch languages on your site.")}
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
                          : account.displayName ?? t("Cuenta conectada", "Connected account")}
                    </p>
                    <p className="text-xs text-ink/60">
                      {formatCount(account.followers, lang)} {t("seguidores", "followers")} · {t("conectada el", "connected on")} {formatShortDate(account.connectedAt, lang)}
                      {expiresIn != null &&
                        ` · ${t("token vence", "token expires")} ${expiresIn <= 0 ? t("ya (se renueva al probar)", "now (renews when you test)") : t(`en ${expiresIn}d`, `in ${expiresIn}d`)}`}
                    </p>
                    {account.lastError && <p className="mt-1 text-xs font-semibold text-coral">{t("Último error:", "Last error:")} {socialError(lang, account.lastError)}</p>}
                  </div>
                </div>
              ) : !card.configured ? (
                <div className="rounded-[14px] bg-cream px-sp-4 py-sp-3 text-[13px] text-ink/70">
                  {t("Faltan estas variables de entorno:", "These environment variables are missing:")}{" "}
                  {card.missingEnv.map((key) => (
                    <code key={key} className="mr-1 rounded bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-ink">
                      {key}
                    </code>
                  ))}
                </div>
              ) : null}

              <div>
                <p className={eyebrowClass}>{t(`URL de redirección (cópiala en la consola de ${card.label})`, `Redirect URL (paste it in the ${card.label} console)`)}</p>
                <div className="mt-sp-1 flex items-center gap-sp-2">
                  <code className="min-w-0 flex-1 truncate rounded-[10px] border border-line bg-white px-sp-3 py-sp-2 font-mono text-[11px] text-ink">
                    {card.redirectUri}
                  </code>
                  <CopyButton value={card.redirectUri} />
                </div>
                <p className="mt-sp-1 text-[11px] text-ink/45">
                  {t("Permisos que se piden:", "Requested permissions:")} {card.scopes.map((s) => s.replace("https://www.googleapis.com/auth/", "")).join(", ")} ·{" "}
                  <a href={card.consoleUrl} target="_blank" rel="noreferrer" className="text-coral hover:underline">
                    {t("Abrir consola ↗", "Open console ↗")}
                  </a>
                </p>
              </div>

              <div className="grid gap-sp-3 sm:grid-cols-3">
                <div>
                  <p className={eyebrowClass}>{t("Ya funciona", "Works now")}</p>
                  <ul className="mt-sp-1 flex flex-col gap-1 text-[13px] text-ink/80">
                    {card.can.map((line) => (
                      <li key={line}>✓ {line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={eyebrowClass}>{t("Posible más adelante", "Possible later")}</p>
                  <ul className="mt-sp-1 flex flex-col gap-1 text-[13px] text-ink/70">
                    {card.later.map((line) => (
                      <li key={line}>◷ {line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={eyebrowClass}>{t("No se puede", "Not possible")}</p>
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
                    {account ? t("Volver a conectar", "Reconnect") : t(`Conectar ${card.label}`, `Connect ${card.label}`)}
                  </a>
                ) : (
                  <span className={`${secondaryButtonClass} cursor-not-allowed opacity-50`}>
                    {card.configured ? t("Falta TOKEN_ENCRYPTION_KEY", "TOKEN_ENCRYPTION_KEY is missing") : t("Configura las variables primero", "Set up the variables first")}
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
                      {testing === card.id ? t("Probando…", "Testing…") : t("Probar", "Test")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDisconnect(card)}
                      className="px-sp-2 text-sm font-medium text-ink/50 hover:text-ink"
                    >
                      {t("Desconectar", "Disconnect")}
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
              <h2 className="font-fraunces text-[22px] font-semibold text-ink">{t("IA (Claude)", "AI (Claude)")}</h2>
              <p className="text-xs text-ink/55">{t("Para “Sugerir con IA” en Crear publicación · modelo", "For “Suggest with AI” in Create post · model")} {ai.model}</p>
            </div>
          </div>
          {ai.configured ? (
            <span className="rounded-full bg-sage/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-cobalt">
              {t("Configurada", "Set up")}
            </span>
          ) : (
            <span className="rounded-full bg-ink/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink/60">
              {t("Sin configurar", "Not set up")}
            </span>
          )}
        </div>
        {!ai.configured && (
          <p className="text-[13px] text-ink/70">
            {t("Falta", "Missing")} <code className="font-mono font-bold">ANTHROPIC_API_KEY</code>. {t("Créala en", "Create it at")}{" "}
            <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noreferrer" className="text-coral hover:underline">
              platform.claude.com ↗
            </a>{" "}
            {t("y agrégala en Vercel.", "and add it in Vercel.")}
          </p>
        )}
        <div>
          <button type="button" onClick={runAiTest} disabled={!ai.configured || aiTesting} className={primaryButtonClass}>
            {aiTesting ? t("Probando…", "Testing…") : t("Probar IA", "Test AI")}
          </button>
        </div>
        {aiResult &&
          (aiResult.ok ? (
            <div className="rounded-[14px] bg-ink p-sp-4 text-cream">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-lime">{t("Respuesta de prueba", "Test response")}</p>
              <p className="mt-sp-2 font-fraunces text-lg italic">{aiResult.sample}</p>
              <p className="mt-sp-2 text-xs text-cream/60">
                {aiResult.model} · {aiResult.ms} ms · {aiResult.usage?.input} {t("tokens de entrada", "input tokens")} / {aiResult.usage?.output} {t("de salida", "output")}
              </p>
            </div>
          ) : (
            <p className="rounded-[14px] bg-coral/15 px-sp-4 py-sp-3 text-sm font-semibold text-moss">{aiResult.error}</p>
          ))}
      </Card>

      {confirmDisconnect && (
        <ConfirmDialog
          title={t(`Desconectar ${confirmDisconnect.label}`, `Disconnect ${confirmDisconnect.label}`)}
          description={t("Se borran los tokens guardados. Para quitar el permiso por completo, revócalo también desde la configuración de la red.", "The saved tokens are deleted. To remove the permission completely, also revoke it from the network's settings.")}
          confirmLabel={t("Desconectar", "Disconnect")}
          onConfirm={() => disconnect(confirmDisconnect)}
          onCancel={() => setConfirmDisconnect(null)}
        />
      )}
    </div>
  );
}

function TestResultView({ result }: { result: TestResult }) {
  const { t, lang } = useT();
  if (!result.ok) {
    return (
      <div className="rounded-[14px] bg-coral/15 px-sp-4 py-sp-3 text-sm text-moss">
        <p className="font-semibold">{t("La API respondió con error", "The API returned an error")}</p>
        <p className="mt-1 break-words font-mono text-xs">{result.error && socialError(lang, result.error)}</p>
      </div>
    );
  }
  const profile = result.profile;
  return (
    <div className="rounded-[14px] bg-ink p-sp-4 text-cream">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-lime">
        {t("Respuesta de la API", "API response")}{result.refreshed ? t(" · token renovado", " · token renewed") : ""}
      </p>
      {profile && (
        <div className="mt-sp-2 grid grid-cols-2 gap-sp-3 sm:grid-cols-4">
          <div>
            <p className="font-fraunces text-xl font-semibold">{formatCount(profile.followers, lang)}</p>
            <p className="text-[11px] text-cream/60">{t("Seguidores", "Followers")}</p>
          </div>
          {Object.entries(profile.extra).map(([label, value]) => (
            <div key={label}>
              <p className="truncate font-fraunces text-xl font-semibold">
                {typeof value === "number" ? formatCount(value, lang) : socialCopy(lang, String(value ?? "—"))}
              </p>
              <p className="text-[11px] text-cream/60">{socialCopy(lang, label)}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-sp-4 font-mono text-[10px] uppercase tracking-[0.12em] text-lime">
        {t("Publicaciones recientes", "Recent posts")} ({result.recent?.length ?? 0})
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
                  {item.title || t("(sin texto)", "(no text)")}
                </a>
                <p className="text-[11px] text-cream/60">
                  {[
                    item.publishedAt ? formatShortDate(item.publishedAt, lang) : null,
                    ...Object.entries(item.metrics).map(([label, value]) => `${formatCount(value, lang)} ${socialCopy(lang, label).toLowerCase()}`),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-sp-2 text-[13px] text-cream/60">{t("La API no devolvió publicaciones.", "The API returned no posts.")}</p>
      )}
    </div>
  );
}
