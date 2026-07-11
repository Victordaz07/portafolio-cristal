import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7F5",
        cobalt: "#4B5320",
        "cobalt-ink": "#2B3013",
        lime: "#C3ACEA",
        moss: "#801F82",
        coral: "#A866BE",
        sage: "#9FB98E",
        ink: "#241227",
        white: "#FFFFFF",
        line: "rgba(36,18,39,0.12)",
      },
      fontFamily: {
        fraunces: ["var(--font-fraunces)"],
        bodoni: ["var(--font-bodoni)"],
        sans: ["var(--font-inter)"],
        mono: ["var(--font-space-mono)"],
      },
      spacing: {
        "sp-1": "4px",
        "sp-2": "8px",
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
