import type { Metadata } from "next";
import { Fraunces, Bodoni_Moda, Inter, Space_Mono, Parisienne, Work_Sans } from "next/font/google";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { accentVars, fontVars, BACKGROUND_STYLES, isBackgroundStyleId, DEFAULT_BACKGROUND_STYLE } from "@/lib/theme";
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

// Combinación tipográfica "Moderna" (lib/theme.ts): reemplaza titulares y
// cursiva de énfasis por esta sans-serif vía la variable CSS --font-work-sans.
const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // Cada página pública pone el nombre de su creadora (generateMetadata); esto es el respaldo.
  title: "Foliocrew — Portafolios para creadores de contenido UGC",
  description: "Tu talento merece su espacio: portafolio, media kit y colaboraciones en un solo lugar.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  // Color de acento, tipografía y textura de fondo elegidos en Apariencia; si la base no responde, quedan los valores por defecto.
  const settings = await prisma.siteSettings
    .findFirst({ select: { accentColor: true, fontPairing: true, backgroundStyle: true } })
    .catch(() => null);
  const backgroundStyle = isBackgroundStyleId(settings?.backgroundStyle) ? settings.backgroundStyle : DEFAULT_BACKGROUND_STYLE;
  const backgroundOpacity = BACKGROUND_STYLES[backgroundStyle].opacity;

  return (
    <html
      lang={locale}
      style={{ ...accentVars(settings?.accentColor), ...fontVars(settings?.fontPairing) } as React.CSSProperties}
    >
      <body
        className={`${fraunces.variable} ${bodoniModa.variable} ${inter.variable} ${spaceMono.variable} ${parisienne.variable} ${workSans.variable} relative font-sans bg-cream text-ink antialiased`}
      >
        {backgroundOpacity > 0 && (
          <div
            aria-hidden="true"
            style={{ opacity: backgroundOpacity }}
            className="pointer-events-none fixed inset-0 -z-10 bg-[url('/images/pattern-bg.webp')] bg-repeat print:hidden"
          />
        )}
        {children}
      </body>
    </html>
  );
}
