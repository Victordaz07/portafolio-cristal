import type { Metadata } from "next";
import localFont from "next/font/local";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { accentVars } from "@/lib/theme";
import "./globals.css";

// Todas las tipografías viven en app/fonts (subconjunto latino de Google Fonts, licencia OFL): así el
// build no depende de que Google responda bien, algo que ya tumbó deploys y la CI.
const fraunces = localFont({ src: [{ path: "./fonts/fraunces-italic-500-600.woff2", weight: "500 600", style: "italic" }, { path: "./fonts/fraunces-normal-500-600.woff2", weight: "500 600", style: "normal" }], variable: "--font-fraunces", display: "swap" });
const parisienne = localFont({ src: "./fonts/parisienne-normal-400.woff2", weight: "400", style: "normal", variable: "--font-script", display: "swap" });
const bodoniModa = localFont({ src: "./fonts/bodoni-moda-italic-700.woff2", weight: "700", style: "italic", variable: "--font-bodoni", display: "swap" });
const inter = localFont({ src: "./fonts/inter-normal-400-800.woff2", weight: "400 800", style: "normal", variable: "--font-inter", display: "swap" });
const spaceMono = localFont({ src: [{ path: "./fonts/space-mono-normal-400.woff2", weight: "400", style: "normal" }, { path: "./fonts/space-mono-normal-700.woff2", weight: "700", style: "normal" }], variable: "--font-space-mono", display: "swap" });

// Tipografías del Estudio de diseño (lib/design.ts → FONTS). Sin precarga: el navegador solo
// descarga las que usa el sitio que está viendo.
const playfair = localFont({ src: [{ path: "./fonts/playfair-display-italic-500-700.woff2", weight: "500 700", style: "italic" }, { path: "./fonts/playfair-display-normal-500-700.woff2", weight: "500 700", style: "normal" }], variable: "--font-playfair", display: "swap", preload: false });
const grotesk = localFont({ src: "./fonts/space-grotesk-latin.woff2", weight: "500 700", variable: "--font-grotesk", display: "swap", preload: false });
const dmSans = localFont({ src: "./fonts/dm-sans-normal-400-700.woff2", weight: "400 700", style: "normal", variable: "--font-dmsans", display: "swap", preload: false });
const cormorant = localFont({ src: [{ path: "./fonts/cormorant-garamond-italic-500-700.woff2", weight: "500 700", style: "italic" }, { path: "./fonts/cormorant-garamond-normal-500-700.woff2", weight: "500 700", style: "normal" }], variable: "--font-cormorant", display: "swap", preload: false });
const fredoka = localFont({ src: "./fonts/fredoka-normal-500-700.woff2", weight: "500 700", style: "normal", variable: "--font-fredoka", display: "swap", preload: false });
const nunito = localFont({ src: "./fonts/nunito-normal-400-800.woff2", weight: "400 800", style: "normal", variable: "--font-nunito", display: "swap", preload: false });
const archivo = localFont({ src: "./fonts/archivo-normal-600-900.woff2", weight: "600 900", style: "normal", variable: "--font-archivo", display: "swap", preload: false });
const designFonts = [playfair, grotesk, dmSans, cormorant, fredoka, nunito, archivo].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  // Cada página pública pone el nombre de su creadora (generateMetadata); esto es el respaldo.
  title: "Foliocrew — Portafolios para creadores de contenido",
  description: "Tu talento merece su espacio: portafolio, media kit y colaboraciones en un solo lugar.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  // El color de acento elegido en Apariencia; si la base no responde, queda el lila por defecto.
  const settings = await prisma.siteSettings.findFirst({ select: { accentColor: true, customAccent: true } }).catch(() => null);

  return (
    <html lang={locale} style={accentVars(settings?.accentColor, settings?.customAccent) as React.CSSProperties}>
      <body
        className={`${fraunces.variable} ${bodoniModa.variable} ${inter.variable} ${spaceMono.variable} ${parisienne.variable} ${designFonts} relative font-sans bg-cream text-ink antialiased`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-[url('/images/pattern-bg.webp')] bg-repeat opacity-25 print:hidden"
        />
        {children}
      </body>
    </html>
  );
}
