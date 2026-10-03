import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Sombras del handoff "link en bio" (/enlaces).
      boxShadow: {
        "fc-card": "0 4px 14px rgba(75,83,32,.05)",
        "fc-hero": "0 14px 30px rgba(36,18,39,.18)",
        "fc-frame": "0 30px 70px rgba(36,18,39,.12)",
      },
      colors: {
        // Colores base: variables CSS con los valores originales por defecto (app/globals.css).
        // El sitio público las cambia según el estilo del Estudio de diseño (lib/design.ts); el panel no.
        cream: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        cobalt: "rgb(var(--c-inverse) / <alpha-value>)",
        "cobalt-ink": "rgb(var(--c-inverse-deep) / <alpha-value>)",
        // Acento configurable en Apariencia (lib/theme.ts): variables CSS en canales RGB.
        lime: "rgb(var(--accent-light) / <alpha-value>)",
        moss: "rgb(var(--accent-dark) / <alpha-value>)",
        coral: "rgb(var(--accent) / <alpha-value>)",
        sage: "#9FB98E",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        white: "#FFFFFF",
        line: "rgb(var(--c-ink) / 0.12)",
      },
      fontFamily: {
        fraunces: ["var(--font-fraunces)"],
        bodoni: ["var(--font-bodoni)"],
        sans: ["var(--font-inter)"],
        mono: ["var(--font-space-mono)"],
        script: ["var(--font-script)"],
      },
      spacing: {
        "sp-1": "4px",
        "sp-1.5": "6px",
        "sp-2": "8px",
        "sp-2.5": "10px",
        "sp-3": "12px",
        "sp-4": "16px",
        "sp-5": "24px",
        "sp-6": "32px",
        "sp-7": "48px",
        "sp-8": "64px",
        "sp-9": "96px",
        "sp-10": "128px",
      },
      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "28px",
        full: "9999px",
      },
      maxWidth: {
        content: "1180px",
      },
    },
  },
  plugins: [],
};
export default config;
