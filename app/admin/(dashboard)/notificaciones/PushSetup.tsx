"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { ALL_TOPICS, PUSH_TOPICS, type PushTopic } from "@/lib/push";

type Status = { configured: boolean; publicKey: string | null; devices: { endpoint: string; topics: string[] }[] };

function keyToBytes(base64: string) {
  const padded = base64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export default function PushSetup() {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [supported, setSupported] = useState(true);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [topics, setTopics] = useState<PushTopic[]>(ALL_TOPICS);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [installEvent, setInstallEvent] = useState<(Event & { prompt: () => Promise<void> }) | null>(null);
  const [standalone, setStandalone] = useState(true);
  const [isIos, setIsIos] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/push/status");
    if (response.ok) setStatus((await response.json()) as Status);
  }, []);

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    setPermission(ok ? Notification.permission : "unsupported");
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as Event & { prompt: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    refresh();
    if (ok) {
      navigator.serviceWorker.getRegistration("/admin").then((reg) => reg?.pushManager.getSubscription()).then((sub) => setEndpoint(sub?.endpoint ?? null)).catch(() => undefined);
    }
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, [refresh]);

  const mine = status?.devices.find((d) => d.endpoint === endpoint) ?? null;
  useEffect(() => {
    if (mine) setTopics(mine.topics.filter((x): x is PushTopic => ALL_TOPICS.includes(x as PushTopic)));
  }, [mine]);

  async function enable() {
    if (!status?.publicKey) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/admin" });
      await navigator.serviceWorker.ready;
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        showToast("error", t("No diste permiso para los avisos. Puedes cambiarlo en los ajustes del navegador.", "You didn't allow notices. You can change it in your browser settings."));
        return;
      }
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(status.publicKey) }));
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const response = await fetch("/api/admin/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, topics }) });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        await sub.unsubscribe().catch(() => undefined);
        showToast("error", data.error ?? t("No se pudo activar", "Couldn't turn on"));
        return;
      }
      setEndpoint(sub.endpoint);
      showToast("success", t("Avisos activados en este dispositivo", "Notices turned on for this device"));
      await refresh();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : t("No se pudo activar", "Couldn't turn on"));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!endpoint) return;
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration("/admin");
    const sub = await reg?.pushManager.getSubscription();
    await fetch("/api/admin/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint }) });
    await sub?.unsubscribe().catch(() => undefined);
    setEndpoint(null);
    setBusy(false);
    showToast("success", t("Avisos desactivados en este dispositivo", "Notices turned off for this device"));
    await refresh();
  }

  async function toggleTopic(topic: PushTopic) {
    const next = topics.includes(topic) ? topics.filter((x) => x !== topic) : [...topics, topic];
    setTopics(next);
    if (endpoint) {
      const response = await fetch("/api/admin/push/subscribe", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint, topics: next }) });
      if (!response.ok) showToast("error", t("No se pudo guardar", "Couldn't save"));
    }
  }

  async function sendTest() {
    setBusy(true);
    const response = await fetch("/api/admin/push/test", { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as { error?: string; sent?: number };
    setBusy(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo enviar", "Couldn't send"));
    showToast("success", data.sent ? t("Aviso de prueba enviado", "Test notice sent") : t("No se pudo entregar la prueba", "The test couldn't be delivered"));
  }

  const eyebrow = "mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral";
  return (
    <>
      {installEvent && (
        <Card>
          <p className={eyebrow}>{t("Instalar la app", "Install the app")}</p>
          <button type="button" onClick={() => installEvent.prompt()} className={primaryButtonClass}>{t("Instalar Foliocrew", "Install Foliocrew")}</button>
        </Card>
      )}
      <Card>
        <p className={eyebrow}>{t("Avisos en este dispositivo", "Notices on this device")}</p>
        {status && !status.configured ? (
          <p className="text-sm text-ink/70">{t("Los avisos en el celular todavía no están activos en Foliocrew. Cuando lo estén, podrás activarlos aquí.", "Phone notices aren't active on Foliocrew yet. Once they are, you'll be able to turn them on here.")}</p>
        ) : !supported ? (
          <p className="text-sm text-ink/70">{t("Este navegador no permite avisos. Prueba con Chrome, Edge, Firefox o Safari (iPhone: desde la app instalada).", "This browser doesn't support notices. Try Chrome, Edge, Firefox or Safari (iPhone: from the installed app).")}</p>
        ) : isIos && !standalone ? (
          <p className="text-sm text-ink/70">{t("En iPhone, primero añade Foliocrew a la pantalla de inicio (Compartir → Añadir a pantalla de inicio), ábrela desde ahí y vuelve a esta página.", "On iPhone, first add Foliocrew to your Home Screen (Share → Add to Home Screen), open it from there and come back to this page.")}</p>
        ) : permission === "denied" ? (
          <p className="text-sm text-coral">{t("Bloqueaste los avisos de este sitio. Actívalos en los ajustes del navegador y recarga la página.", "You blocked notices for this site. Turn them on in your browser settings and reload the page.")}</p>
        ) : (
          <div className="flex flex-col gap-sp-3">
            <p className="text-sm text-ink/80">{endpoint ? t("✅ Los avisos están activos en este dispositivo.", "✅ Notices are on for this device.") : t("Aún no activaste los avisos en este dispositivo.", "You haven't turned on notices on this device yet.")}</p>
            <ul className="flex flex-col gap-sp-2">
              {PUSH_TOPICS.map((topic) => (
                <li key={topic.id}>
                  <label className="flex items-start gap-sp-2 text-sm text-ink">
                    <input type="checkbox" className="mt-1" checked={topics.includes(topic.id)} onChange={() => toggleTopic(topic.id)} />
                    <span>
                      {lang === "en" ? topic.labelEn : topic.label}
                      <span className="block text-xs text-ink/55">{lang === "en" ? topic.hintEn : topic.hint}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-sp-2">
              {endpoint ? (
                <>
                  <button type="button" onClick={sendTest} disabled={busy} className={secondaryButtonClass}>{t("Enviar aviso de prueba", "Send a test notice")}</button>
                  <button type="button" onClick={disable} disabled={busy} className="text-sm text-red-600/70 hover:text-red-600">{t("Desactivar en este dispositivo", "Turn off on this device")}</button>
                </>
              ) : (
                <button type="button" onClick={enable} disabled={busy || !status?.publicKey || topics.length === 0} className={primaryButtonClass}>{t("Activar avisos", "Turn on notices")}</button>
              )}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
