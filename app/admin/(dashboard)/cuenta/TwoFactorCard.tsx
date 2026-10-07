"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, dangerLinkClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";

type Step = "idle" | "password" | "scan" | "codes" | "disable" | "recovery";

/** Verificación en dos pasos: activar (QR + primer código), ver los códigos de recuperación, desactivar. */
export default function TwoFactorCard({
  enabledAt,
  recoveryLeft,
  available,
  impersonating,
}: {
  /** Fecha en que se activó (ya con formato), o null si está apagada. */
  enabledAt: string | null;
  recoveryLeft: number;
  /** Falta TOKEN_ENCRYPTION_KEY en el servidor: no se puede activar. */
  available: boolean;
  impersonating: boolean;
}) {
  const { t } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("idle");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  async function call(body: object) {
    setBusy(true);
    const response = await fetch("/api/admin/account/two-factor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    const data = (await response.json().catch(() => ({}))) as { error?: string; secret?: string; qr?: string; recoveryCodes?: string[] };
    if (!response.ok) {
      showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
      return null;
    }
    return data;
  }

  function reset() {
    setStep("idle");
    setPassword("");
    setCode("");
    setSetup(null);
  }

  async function start() {
    const data = await call({ action: "start", password });
    if (!data?.secret || !data.qr) return;
    setSetup({ secret: data.secret, qr: data.qr });
    setPassword("");
    setStep("scan");
  }

  async function confirm() {
    const data = await call({ action: "confirm", code });
    if (!data?.recoveryCodes) return;
    setRecoveryCodes(data.recoveryCodes);
    setCode("");
    setSetup(null);
    setStep("codes");
    router.refresh();
  }

  async function disable() {
    const data = await call({ action: "disable", password, code });
    if (!data) return;
    reset();
    showToast("success", t("Verificación en dos pasos desactivada", "Two-step verification turned off"));
    router.refresh();
  }

  async function regenerate() {
    const data = await call({ action: "recovery", password, code });
    if (!data?.recoveryCodes) return;
    setRecoveryCodes(data.recoveryCodes);
    setPassword("");
    setCode("");
    setStep("codes");
    router.refresh();
  }

  function copyCodes() {
    navigator.clipboard?.writeText(recoveryCodes.join("\n")).then(() => showToast("success", t("Códigos copiados", "Codes copied")));
  }

  const passwordField = (
    <label className={labelClass}>
      <span className="text-sm font-medium text-ink">{t("Tu contraseña", "Your password")}</span>
      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={inputClass} />
    </label>
  );
  const codeField = (hint: string) => (
    <label className={labelClass}>
      <span className="text-sm font-medium text-ink">{t("Código", "Code")}</span>
      <input
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={20}
        className={`${inputClass} font-mono tracking-widest`}
      />
      <span className="text-xs text-ink/55">{hint}</span>
    </label>
  );
  const appOrRecovery = t("Los 6 dígitos de tu app, o un código de recuperación.", "The 6 digits from your app, or a recovery code.");

  return (
    <Card>
      <div id="seguridad" className="scroll-mt-sp-6" />
      <div className="flex flex-wrap items-center gap-sp-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Verificación en dos pasos", "Two-step verification")}</p>
        {enabledAt ? (
          <span className="rounded-full bg-sage/30 px-[8px] py-0.5 font-mono text-[10px] uppercase text-cobalt-ink">{t("Activa", "On")}</span>
        ) : (
          <span className="rounded-full bg-cream px-[8px] py-0.5 font-mono text-[10px] uppercase text-ink/60">{t("Apagada", "Off")}</span>
        )}
      </div>
      <p className="mt-sp-2 text-sm text-ink/80">
        {enabledAt
          ? t(
              `Activa desde el ${enabledAt}. Para entrar hace falta tu contraseña y un código de tu app de autenticación.`,
              `On since ${enabledAt}. Signing in takes your password and a code from your authenticator app.`
            )
          : t(
              "Además de la contraseña, se pide un código de 6 dígitos que cambia cada 30 segundos en una app de tu teléfono (Google Authenticator, Authy, 1Password o Contraseñas del iPhone). Aunque alguien adivine tu contraseña, no puede entrar.",
              "On top of your password, you're asked for a 6-digit code that changes every 30 seconds in an app on your phone (Google Authenticator, Authy, 1Password or iPhone Passwords). Even if someone guesses your password, they can't get in."
            )}
      </p>

      {impersonating ? (
        <p className="mt-sp-3 text-sm text-ink/60">{t("Mientras el equipo ayuda en esta cuenta, la seguridad no se puede cambiar.", "While the team is helping on this account, security settings can't be changed.")}</p>
      ) : step === "codes" ? (
        <div className="mt-sp-4 rounded-[14px] border border-line bg-cream p-sp-4">
          <p className="text-sm font-semibold text-ink">{t("Guarda estos códigos de recuperación", "Save these recovery codes")}</p>
          <p className="mt-1 text-sm text-ink/70">
            {t(
              "Si pierdes tu teléfono, cada uno sirve una sola vez para entrar. No los vamos a volver a mostrar: guárdalos en tu gestor de contraseñas o imprímelos.",
              "If you lose your phone, each one works once to sign in. We won't show them again: keep them in your password manager or print them."
            )}
          </p>
          <ul className="mt-sp-3 grid grid-cols-2 gap-sp-2 font-mono text-sm text-ink">
            {recoveryCodes.map((c) => (
              <li key={c} className="rounded-md bg-white px-sp-3 py-sp-2 text-center">
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-sp-3 flex flex-wrap gap-sp-2">
            <button type="button" onClick={copyCodes} className={secondaryButtonClass}>
              {t("Copiar", "Copy")}
            </button>
            <button
              type="button"
              onClick={() => {
                setRecoveryCodes([]);
                reset();
              }}
              className={primaryButtonClass}
            >
              {t("Ya los guardé", "I've saved them")}
            </button>
          </div>
        </div>
      ) : enabledAt ? (
        <>
          <p className="mt-sp-2 text-sm text-ink/70">
            {t(`Códigos de recuperación sin usar: ${recoveryLeft}.`, `Unused recovery codes: ${recoveryLeft}.`)}
            {recoveryLeft <= 2 ? t(" Te quedan pocos: genera nuevos.", " You're running low: generate new ones.") : ""}
          </p>
          {step === "idle" && (
            <div className="mt-sp-3 flex flex-wrap items-center gap-sp-4">
              <button type="button" onClick={() => setStep("recovery")} className={secondaryButtonClass}>
                {t("Generar códigos nuevos", "Generate new codes")}
              </button>
              <button type="button" onClick={() => setStep("disable")} className={dangerLinkClass}>
                {t("Desactivar", "Turn off")}
              </button>
            </div>
          )}
          {(step === "disable" || step === "recovery") && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step === "disable") disable();
                else regenerate();
              }}
              className="mt-sp-4 flex max-w-sm flex-col gap-sp-4"
            >
              {passwordField}
              {codeField(appOrRecovery)}
              <div className="flex flex-wrap gap-sp-2">
                <button type="submit" disabled={busy} className={primaryButtonClass}>
                  {busy ? t("Guardando…", "Saving…") : step === "disable" ? t("Desactivar", "Turn off") : t("Generar códigos nuevos", "Generate new codes")}
                </button>
                <button type="button" onClick={reset} className={secondaryButtonClass}>
                  {t("Cancelar", "Cancel")}
                </button>
              </div>
            </form>
          )}
        </>
      ) : !available ? (
        <p className="mt-sp-3 text-sm text-ink/60">{t("Todavía no está disponible en Foliocrew.", "It isn't available on Foliocrew yet.")}</p>
      ) : step === "idle" ? (
        <button type="button" onClick={() => setStep("password")} className={`${primaryButtonClass} mt-sp-3`}>
          {t("Activar", "Turn on")}
        </button>
      ) : step === "password" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
          className="mt-sp-4 flex max-w-sm flex-col gap-sp-4"
        >
          {passwordField}
          <div className="flex flex-wrap gap-sp-2">
            <button type="submit" disabled={busy} className={primaryButtonClass}>
              {busy ? t("Un momento…", "One moment…") : t("Continuar", "Continue")}
            </button>
            <button type="button" onClick={reset} className={secondaryButtonClass}>
              {t("Cancelar", "Cancel")}
            </button>
          </div>
        </form>
      ) : step === "scan" && setup ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
          className="mt-sp-4 flex flex-col gap-sp-4"
        >
          <div className="flex flex-wrap items-start gap-sp-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt={t("Código QR para tu app de autenticación", "QR code for your authenticator app")} width={176} height={176} className="rounded-md border border-line bg-white p-sp-2" />
            <div className="min-w-0 max-w-sm text-sm text-ink/80">
              <p>
                <strong>1.</strong> {t("Abre tu app de autenticación y escanea este código.", "Open your authenticator app and scan this code.")}
              </p>
              <p className="mt-sp-2">{t("¿No puedes escanear? Escribe esta clave en la app:", "Can't scan? Type this key into the app:")}</p>
              <p className="mt-1 break-all rounded-md bg-cream px-sp-3 py-sp-2 font-mono text-xs text-ink">{setup.secret}</p>
              <p className="mt-sp-3">
                <strong>2.</strong> {t("Escribe el código de 6 dígitos que te muestra.", "Enter the 6-digit code it shows you.")}
              </p>
            </div>
          </div>
          <div className="max-w-sm">{codeField(t("Cambia cada 30 segundos.", "It changes every 30 seconds."))}</div>
          <div className="flex flex-wrap gap-sp-2">
            <button type="submit" disabled={busy} className={primaryButtonClass}>
              {busy ? t("Comprobando…", "Checking…") : t("Activar", "Turn on")}
            </button>
            <button type="button" onClick={reset} className={secondaryButtonClass}>
              {t("Cancelar", "Cancel")}
            </button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}
