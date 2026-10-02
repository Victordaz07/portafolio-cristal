import type { Metadata } from "next";
import AdminLoginForm from "@/components/AdminLoginForm";

export const metadata: Metadata = { title: "Entrar — Vitrina UGC", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-sp-4">
      <div className="w-full max-w-sm bg-white rounded-md border border-line p-sp-6 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="Vitrina UGC" className="mb-sp-5 h-10 w-auto" />
        <p className="font-mono text-xs uppercase tracking-widest text-moss mb-sp-2">
          Panel privado
        </p>
        <h1 className="font-fraunces italic font-semibold text-2xl text-ink mb-sp-6">
          Entra a tu vitrina
        </h1>

        <AdminLoginForm />
      </div>
    </main>
  );
}
