import type { Metadata } from "next";
import Link from "next/link";
import LangSwitch from "@/components/admin/LangSwitch";
import { getT } from "@/lib/admin-lang-server";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Foliocrew", robots: { index: false } };

export default async function ForgotPasswordPage() {
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
        <h1 className="font-fraunces italic font-semibold text-2xl text-ink mb-sp-2">{t("¿Olvidaste tu contraseña?", "Forgot your password?")}</h1>
        <p className="mb-sp-5 text-sm text-ink/65">
          {t("Escribe el correo de tu cuenta y te mandamos un enlace para crear una nueva.", "Enter your account email and we'll send you a link to create a new one.")}
        </p>
        <ForgotPasswordForm />
        <p className="mt-sp-5 text-center text-sm text-ink/60">
          <Link href="/admin/login" className="font-medium text-coral hover:underline">
            {t("Volver a entrar", "Back to sign in")}
          </Link>
        </p>
      </div>
    </main>
  );
}
