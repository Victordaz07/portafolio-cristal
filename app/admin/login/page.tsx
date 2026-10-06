import type { Metadata } from "next";
import Link from "next/link";
import AdminLoginForm from "@/components/AdminLoginForm";
import LangSwitch from "@/components/admin/LangSwitch";
import { getT } from "@/lib/admin-lang-server";

export const metadata: Metadata = { title: "Foliocrew", robots: { index: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ correo?: string }> }) {
  const { correo } = await searchParams;
  const { t, lang } = await getT();
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-sp-4">
      <div className="w-full max-w-sm bg-white rounded-md border border-line p-sp-6 shadow-sm">
        <div className="mb-sp-5 flex items-center justify-between gap-sp-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt="Foliocrew" className="h-10 w-auto" />
          <LangSwitch tone="light" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
          {t("Panel privado", "Private dashboard")}
        </p>
        <h1 className="font-fraunces italic font-semibold text-2xl text-ink mb-sp-6">
          {t("Entra a tu espacio", "Sign in to your space")}
        </h1>

        {correo === "confirmado" && (
          <p role="status" className="mb-sp-4 rounded-sm bg-cream p-sp-3 text-sm text-ink">
            {t("✅ Correo confirmado. Entra para seguir.", "✅ Email confirmed. Sign in to continue.")}
          </p>
        )}
        {correo === "vencido" && (
          <p role="alert" className="mb-sp-4 rounded-sm bg-cream p-sp-3 text-sm text-ink">
            {t("Ese enlace venció o ya se usó. Entra y pide uno nuevo desde tu panel.", "That link expired or was already used. Sign in and request a new one from your dashboard.")}
          </p>
        )}
        <AdminLoginForm locale={lang} />
        <p className="mt-sp-3 text-center text-sm">
          <Link href="/admin/recuperar" className="text-ink/60 hover:text-coral hover:underline">
            {t("¿Olvidaste tu contraseña?", "Forgot your password?")}
          </Link>
        </p>
        <p className="mt-sp-5 text-center text-sm text-ink/60">
          {t("¿Creas contenido y quieres tu espacio?", "Do you create content and want your own space?")}{" "}
          <Link href="/admin/registro" className="font-medium text-coral hover:underline">
            {t("Crea tu cuenta", "Create your account")}
          </Link>
        </p>
      </div>
    </main>
  );
}
