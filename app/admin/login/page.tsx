import type { Metadata } from "next";
import Link from "next/link";
import AdminLoginForm from "@/components/AdminLoginForm";

export const metadata: Metadata = { title: "Entrar — Foliocrew", robots: { index: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ correo?: string }> }) {
  const { correo } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-sp-4">
      <div className="w-full max-w-sm bg-white rounded-md border border-line p-sp-6 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="Foliocrew" className="mb-sp-5 h-10 w-auto" />
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
          Panel privado
        </p>
        <h1 className="font-fraunces italic font-semibold text-2xl text-ink mb-sp-6">
          Entra a tu espacio
        </h1>

        {correo === "confirmado" && (
          <p role="status" className="mb-sp-4 rounded-sm bg-cream p-sp-3 text-sm text-ink">
            ✅ Correo confirmado. Entra para seguir.
          </p>
        )}
        {correo === "vencido" && (
          <p role="alert" className="mb-sp-4 rounded-sm bg-cream p-sp-3 text-sm text-ink">
            Ese enlace venció o ya se usó. Entra y pide uno nuevo desde tu panel.
          </p>
        )}
        <AdminLoginForm />
        <p className="mt-sp-3 text-center text-sm">
          <Link href="/admin/recuperar" className="text-ink/60 hover:text-coral hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <p className="mt-sp-5 text-center text-sm text-ink/60">
          ¿Creas contenido y quieres tu espacio?{" "}
          <Link href="/admin/registro" className="font-medium text-coral hover:underline">
            Crea tu cuenta
          </Link>
        </p>
      </div>
    </main>
  );
}
