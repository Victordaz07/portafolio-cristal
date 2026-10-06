import type { Metadata } from "next";
import Link from "next/link";
import { platformRootDomain } from "@/lib/tenant";
import { signupMode } from "@/lib/creators";
import { incomingReferral } from "@/lib/ambassadors-server";
import LangSwitch from "@/components/admin/LangSwitch";
import { getT } from "@/lib/admin-lang-server";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Foliocrew", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  // Si llegó por el enlace de una embajadora activa, el enlace hace de invitación.
  const referral = await incomingReferral(ref);
  const open = Boolean(referral) || signupMode() !== "closed";
  const { t } = await getT();
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-sp-4 py-sp-6">
      <div className="w-full max-w-md rounded-md border border-line bg-white p-sp-6 shadow-sm">
        <div className="mb-sp-5 flex items-center justify-between gap-sp-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt="Foliocrew" className="h-10 w-auto" />
          <LangSwitch tone="light" />
        </div>
        <p className="mb-sp-2 font-mono text-xs uppercase tracking-widest text-moss">{t("Crea tu cuenta", "Create your account")}</p>
        <h1 className="mb-sp-2 font-fraunces text-2xl font-semibold italic text-ink">{t("Tu talento merece su espacio", "Your talent deserves its own space")}</h1>
        {open ? (
          <>
            <p className="mb-sp-5 text-sm text-ink/60">{t("Tu portafolio, tu media kit y tus marcas, en un solo lugar.", "Your portfolio, your media kit and your brands, all in one place.")}</p>
            {referral && (
              <p className="mb-sp-4 rounded-[12px] bg-lime/25 px-sp-3 py-sp-2 text-sm text-moss">
                {t("💜 Te invitó una embajadora de Foliocrew: no necesitas código de invitación.", "💜 A Foliocrew ambassador invited you: you don't need an invite code.")}
              </p>
            )}
            <RegisterForm rootDomain={platformRootDomain()} refCode={referral?.code ?? null} />
          </>
        ) : (
          <p className="mb-sp-5 text-sm text-ink/70">
            {t("Foliocrew todavía no abre al público. Pronto podrás crear tu cuenta aquí.", "Foliocrew isn't open to the public yet. Soon you'll be able to create your account here.")}
          </p>
        )}
        <p className="mt-sp-5 text-center text-sm text-ink/60">
          {t("¿Ya tienes cuenta?", "Already have an account?")}{" "}
          <Link href="/admin/login" className="font-medium text-coral hover:underline">
            {t("Entra aquí", "Sign in here")}
          </Link>
        </p>
      </div>
    </main>
  );
}
