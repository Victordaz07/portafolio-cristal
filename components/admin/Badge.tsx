import type { ReactNode } from "react";

const VARIANTS = {
  neutral: "border border-line bg-cream text-ink/70",
  accent: "border border-coral/25 bg-coral/10 text-coral",
  success: "border border-sage/50 bg-sage/20 text-cobalt-ink",
  new: "border border-coral bg-coral text-white",
} as const;

export default function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-sp-3 py-1 font-mono text-[10px] uppercase tracking-wide ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
