import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Foliocrew — Tu talento merece su espacio",
  description: "Portafolio, media kit y colaboraciones para creadoras UGC, en un solo lugar.",
};

// Portada de foliocrew.app mientras se construye la página de venta completa (Fase 11).
export default function FoliocrewHome() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#251023] px-sp-5 py-sp-6 text-center text-cream">
      <svg aria-hidden className="pointer-events-none absolute -right-24 top-10 h-[520px] w-[520px] opacity-40" viewBox="0 0 200 200" fill="none" stroke="#B692E7" strokeWidth="1.2">
        <path d="M40 40 L110 20 Q120 18 120 28 V150 L50 170 Q40 172 40 162 Z" />
        <path d="M90 60 L160 80 Q170 83 170 93 V180 Q170 190 160 187 L100 170" />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-claro.svg" alt="Foliocrew" className="mb-sp-6 h-12 w-auto" />
      <h1 className="font-fraunces text-5xl font-semibold leading-tight sm:text-7xl">
        Tu talento merece
        <br />
        su <em className="text-[#B692E7]">espacio.</em>
      </h1>
      <p className="mt-sp-5 max-w-xl text-lg text-cream/80">
        Tu portafolio, tu media kit y tus colaboraciones con marcas, en un solo lugar. Hecho para creadoras UGC.
      </p>
      <span className="mt-sp-5 rounded-full bg-[#B692E7]/20 px-sp-4 py-1 font-mono text-xs uppercase tracking-widest text-[#B692E7]">
        Lanzamiento por invitación
      </span>
      <div className="mt-sp-6 flex flex-wrap justify-center gap-sp-3">
        <Link href="/admin/registro" className="rounded-full bg-[#B692E7] px-sp-6 py-sp-3 font-semibold text-[#251023] hover:opacity-90">
          Crear mi cuenta
        </Link>
        <Link href="/admin/login" className="rounded-full border border-cream/30 px-sp-6 py-sp-3 font-semibold text-cream hover:bg-cream/10">
          Entrar
        </Link>
      </div>
      <p className="absolute bottom-sp-5 text-xs text-cream/40">Crea. Conecta. Crece.</p>
    </main>
  );
}
