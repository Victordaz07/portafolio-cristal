import type { Metadata } from "next";
import Link from "next/link";
import { authTokenIsValid } from "@/lib/auth-tokens";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Contraseña nueva — Foliocrew", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const valid = await authTokenIsValid(token, "reset");

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-sp-4">
      <div className="w-full max-w-sm bg-white rounded-md border border-line p-sp-6 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="Foliocrew" className="mb-sp-5 h-10 w-auto" />
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">Panel privado</p>
        {valid ? (
          <>
            <h1 className="font-fraunces italic font-semibold text-2xl text-ink mb-sp-5">Crea tu contraseña nueva</h1>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <>
            <h1 className="font-fraunces italic font-semibold text-2xl text-ink mb-sp-2">Este enlace ya no sirve</h1>
            <p className="mb-sp-5 text-sm text-ink/65">Venció (dura 1 hora) o ya se usó. Pide uno nuevo y usa el más reciente.</p>
            <Link
              href="/admin/recuperar"
              className="block rounded-sm bg-coral py-sp-3 text-center font-medium text-white hover:opacity-90"
            >
              Pedir un enlace nuevo
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
