import type { Metadata } from "next";
import {
  Fraunces,
  Bodoni_Moda,
  Inter,
  Space_Mono,
  Parisienne,
  Playfair_Display,
  DM_Sans,
  Cormorant_Garamond,
  Fredoka,
  Nunito,
  Archivo,
} from "next/font/google";
import localFont from "next/font/local";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { accentVars } from "@/lib/theme";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const parisienne = Parisienne({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-script",
  display: "swap",
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
  variable: "--font-bodoni",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

// Tipografías del Estudio de diseño (lib/design.ts → FONTS). Sin precarga: el navegador solo
// descarga las que usa el sitio que está viendo.
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--font-playfair", display: "swap", preload: false });
// Alojada en el proyecto: Google Fonts a veces responde mal a los builds de producción con esta fuente.
const grotesk = localFont({ src: "./fonts/space-grotesk-latin.woff2", weight: "500 700", variable: "--font-grotesk", display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dmsans", display: "swap", preload: false });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap", preload: false });
const fredoka = Fredoka({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-fredoka", display: "swap", preload: false });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-nunito", display: "swap", preload: false });
const archivo = Archivo({ subsets: ["latin"], weight: ["600", "800", "900"], variable: "--font-archivo", display: "swap", preload: false });
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
