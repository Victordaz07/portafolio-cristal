import type { Metadata } from "next";
import Link from "next/link";
import { platformRootDomain } from "@/lib/tenant";
import { signupMode } from "@/lib/creators";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Crear cuenta — Foliocrew", robots: { index: false } };

export default function RegisterPage() {
  const open = signupMode() !== "closed";
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-sp-4 py-sp-6">
      <div className="w-full max-w-md rounded-md border border-line bg-white p-sp-6 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="Foliocrew" className="mb-sp-5 h-10 w-auto" />
        <p className="mb-sp-2 font-mono text-xs uppercase tracking-widest text-moss">Crea tu cuenta</p>
        <h1 className="mb-sp-2 font-fraunces text-2xl font-semibold italic text-ink">Tu talento merece su espacio</h1>
        {open ? (
          <>
            <p className="mb-sp-5 text-sm text-ink/60">Tu portafolio, tu media kit y tus marcas, en un solo lugar.</p>
            <RegisterForm rootDomain={platformRootDomain()} />
          </>
        ) : (
          <p className="mb-sp-5 text-sm text-ink/70">
            Foliocrew todavía no abre al público. Pronto podrás crear tu cuenta aquí.
          </p>
        )}
        <p className="mt-sp-5 text-center text-sm text-ink/60">
          ¿Ya tienes cuenta?{" "}
          <Link href="/admin/login" className="font-medium text-coral hover:underline">
            Entra aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
