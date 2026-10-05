import type { Metadata } from "next";
import Link from "next/link";
import { authTokenIsValid } from "@/lib/auth-tokens";
import LangSwitch from "@/components/admin/LangSwitch";
import { getT } from "@/lib/admin-lang-server";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Foliocrew", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const valid = await authTokenIsValid(token, "reset");
  const { t } = await getT();

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-sp-4">
      <div className="w-full max-w-sm bg-white rounded-md border border-line p-sp-6 shadow-sm">
        <div className="mb-sp-5 flex items-center justify-between gap-sp-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt="Foliocrew" className="h-10 w-auto" />
          <LangSwitch tone="light" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">{t("Panel privado", "Private dashboard")}</p>
        {valid ? (
          <>
            <h1 className="font-fraunces italic font-semibold text-2xl text-ink mb-sp-5">{t("Crea tu contraseña nueva", "Create your new password")}</h1>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <>
            <h1 className="font-fraunces italic font-semibold text-2xl text-ink mb-sp-2">{t("Este enlace ya no sirve", "This link no longer works")}</h1>
            <p className="mb-sp-5 text-sm text-ink/65">
              {t("Venció (dura 1 hora) o ya se usó. Pide uno nuevo y usa el más reciente.", "It expired (links last 1 hour) or was already used. Request a new one and use the most recent.")}
            </p>
            <Link
              href="/admin/recuperar"
              className="block rounded-sm bg-coral py-sp-3 text-center font-medium text-white hover:opacity-90"
            >
              {t("Pedir un enlace nuevo", "Request a new link")}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
