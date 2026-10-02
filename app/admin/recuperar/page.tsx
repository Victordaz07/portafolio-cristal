import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Recuperar contraseña — Foliocrew", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-sp-4">
      <div className="w-full max-w-sm bg-white rounded-md border border-line p-sp-6 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="Foliocrew" className="mb-sp-5 h-10 w-auto" />
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">Panel privado</p>
        <h1 className="font-fraunces italic font-semibold text-2xl text-ink mb-sp-2">¿Olvidaste tu contraseña?</h1>
        <p className="mb-sp-5 text-sm text-ink/65">Escribe el correo de tu cuenta y te mandamos un enlace para crear una nueva.</p>
        <ForgotPasswordForm />
        <p className="mt-sp-5 text-center text-sm text-ink/60">
          <Link href="/admin/login" className="font-medium text-coral hover:underline">
            Volver a entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
