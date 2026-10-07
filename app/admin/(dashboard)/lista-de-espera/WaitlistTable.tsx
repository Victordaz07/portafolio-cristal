"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import { useToast } from "@/components/admin/ToastContext";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { dateLocale, pickLabel } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

interface Row {
  id: string;
  email: string;
  instagram: string | null;
  niche: string | null;
  audience: string | null;
  source: string;
  status: string;
  /** Pidió no recibir más correos (enlace de baja): no se le manda la invitación. */
  unsubscribed: boolean;
  createdAt: string;
}

const STATUS: Record<string, { label: string; labelEn: string; className: string }> = {
  waiting: { label: "En espera", labelEn: "Waiting", className: "bg-cream text-ink/60" },
  invited: { label: "Invitación enviada", labelEn: "Invite sent", className: "bg-sage/30 text-cobalt-ink" },
  joined: { label: "Cuenta creada", labelEn: "Account created", className: "bg-coral/15 text-coral" },
};

export default function WaitlistTable({
  entries,
  inviteCodeSet,
  emailReady,
  registerUrl,
  landingUrl,
}: {
  entries: Row[];
  inviteCodeSet: boolean;
  emailReady: boolean;
  registerUrl: string;
  landingUrl: string;
}) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  async function run(action: "email" | "invited" | "waiting") {
    if (action === "email" && !window.confirm(
        t(
          `¿Mandar la invitación por correo a ${selected.size} persona(s)? El correo incluye tu código de invitación.`,
          `Email the invite to ${selected.size} person(s)? The email includes your invite code.`
        )
      )) return;
    setBusy(true);
    const response = await fetch("/api/admin/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), action }),
    });
    setBusy(false);
    const body = (await response.json().catch(() => ({}))) as { error?: string; sent?: number; failed?: number; skipped?: number };
    if (!response.ok) return showToast("error", body.error ?? t("No se pudo actualizar", "Couldn't update"));
    if (action === "email") {
      showToast(body.failed ? "error" : "success", t(
          `Invitaciones enviadas: ${body.sent ?? 0}${body.failed ? ` · fallaron: ${body.failed}` : ""}${body.skipped ? ` · se dieron de baja: ${body.skipped}` : ""}`,
          `Invites sent: ${body.sent ?? 0}${body.failed ? ` · failed: ${body.failed}` : ""}${body.skipped ? ` · unsubscribed: ${body.skipped}` : ""}`
        ));
    } else {
      showToast("success", action === "invited" ? t("Invitación marcada como enviada", "Invite marked as sent") : t("De vuelta en espera", "Back to waiting"));
    }
    setSelected(new Set());
    router.refresh();
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card>
      <div className="mb-sp-4 flex flex-wrap items-center justify-between gap-sp-3">
        <p className="text-sm text-ink/65">
          {t("Para invitar: manda el link de registro", "To invite: send the sign-up link")}{" "}
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(registerUrl).then(() => showToast("success", t("Link copiado", "Link copied")))}
            className="font-mono text-coral hover:underline"
            title={t("Copiar link", "Copy link")}
          >
            {registerUrl}
          </button>{" "}
          {t("junto con tu código de invitación", "along with your invite code")}
          {inviteCodeSet ? "" : t(" (todavía no configuraste SIGNUP_INVITE_CODE en Vercel)", " (you haven't set SIGNUP_INVITE_CODE in Vercel yet)")}
          {t(", o selecciona personas y toca", ", or select people and tap")} <strong>{t("Invitar por correo", "Invite by email")}</strong>
          {t(": les llega el link y el código.", ": they get the link and the code.")}
          {emailReady ? "" : t(" (Para mandar correos falta configurar RESEND_API_KEY en Vercel.)", " (To send emails, set RESEND_API_KEY in Vercel.)")}
        </p>
        <div className="flex flex-wrap gap-sp-2">
          <button
            type="button"
            disabled={!selected.size || busy || !emailReady || !inviteCodeSet}
            onClick={() => run("email")}
            className={primaryButtonClass}
          >
            {busy ? t("Enviando…", "Sending…") : t(`Invitar por correo (${selected.size})`, `Invite by email (${selected.size})`)}
          </button>
          <button type="button" disabled={!selected.size || busy} onClick={() => run("invited")} className={secondaryButtonClass}>
            {t("Marcar invitación enviada", "Mark invite sent")}
          </button>
          <button type="button" disabled={!selected.size || busy} onClick={() => run("waiting")} className={secondaryButtonClass}>
            {t("Volver a espera", "Back to waiting")}
          </button>
          <a href="/api/admin/waitlist" className={secondaryButtonClass}>
            {t("Descargar CSV", "Download CSV")}
          </a>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-ink/55">
          {t("Todavía nadie se anotó. Comparte tu página de venta:", "Nobody has signed up yet. Share your sales page:")} {landingUrl}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="font-mono text-[10px] uppercase tracking-wide text-ink/50">
              <tr>
                <th className="py-sp-2 pr-sp-2">
                  <input
                    type="checkbox"
                    aria-label={t("Seleccionar todo", "Select all")}
                    checked={selected.size === entries.length}
                    onChange={(e) => setSelected(e.target.checked ? new Set(entries.map((r) => r.id)) : new Set())}
                  />
                </th>
                <th className="py-sp-2 pr-sp-3">#</th>
                <th className="py-sp-2 pr-sp-3">{t("Correo", "Email")}</th>
                <th className="py-sp-2 pr-sp-3">Instagram</th>
                <th className="py-sp-2 pr-sp-3">{t("Nicho", "Niche")}</th>
                <th className="py-sp-2 pr-sp-3">{t("Seguidores", "Followers")}</th>
                <th className="py-sp-2 pr-sp-3">{t("Origen", "Source")}</th>
                <th className="py-sp-2 pr-sp-3">{t("Fecha", "Date")}</th>
                <th className="py-sp-2">{t("Estado", "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((r, i) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="py-sp-2 pr-sp-2">
                    <input type="checkbox" aria-label={t(`Seleccionar ${r.email}`, `Select ${r.email}`)} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td className="py-sp-2 pr-sp-3 font-mono text-ink/55">{i + 1}</td>
                  <td className="py-sp-2 pr-sp-3">{r.email}</td>
                  <td className="py-sp-2 pr-sp-3">
                    {r.instagram ? (
                      <a href={`https://instagram.com/${r.instagram}`} target="_blank" rel="noreferrer" className="text-coral hover:underline">
                        @{r.instagram}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-sp-2 pr-sp-3">{r.niche ?? "—"}</td>
                  <td className="py-sp-2 pr-sp-3">{r.audience ?? "—"}</td>
                  <td className="py-sp-2 pr-sp-3 text-ink/60">{r.source || t("directo", "direct")}</td>
                  <td className="py-sp-2 pr-sp-3 text-ink/60">{new Date(r.createdAt).toLocaleDateString(dateLocale(lang))}</td>
                  <td className="py-sp-2">
                    <span className={`rounded-full px-[8px] py-0.5 font-mono text-[10px] uppercase ${STATUS[r.status]?.className ?? STATUS.waiting.className}`}>
                      {STATUS[r.status] ? pickLabel(lang, STATUS[r.status]) : r.status}
                    </span>
                    {r.unsubscribed && (
                      <span className="ml-1 rounded-full bg-red-50 px-[8px] py-0.5 font-mono text-[10px] uppercase text-red-700" title={t("Pidió no recibir más correos: no se le envía la invitación.", "Asked not to get more emails: the invite won't be sent.")}>
                        {t("Baja", "Unsubscribed")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
