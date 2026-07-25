import type { Metadata } from "next";
import { Fraunces, Bodoni_Moda, Inter, Space_Mono, Parisienne } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Cristal Flores — UGC Content Creator",
  description:
    "Portafolio de Cristal Amalia Flores Bello — creadora UGC en beauty, skincare, hair, books y lifestyle. Media kit, contenido real y paquetes de colaboración.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${fraunces.variable} ${bodoniModa.variable} ${inter.variable} ${spaceMono.variable} ${parisienne.variable} relative font-sans bg-cream text-ink antialiased`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-[url('/images/pattern-bg.webp')] bg-repeat opacity-[0.12]"
        />
        {children}
      </body>
    </html>
  );
}
