import type { ReactNode } from "react";

/**
 * Convención simple para el admin: `**texto**` resalta en negrita color ink,
 * `__texto__` resalta en negrita color lime (acento de marca).
 */
export function renderHighlightedText(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("__") && part.endsWith("__")) {
      return (
        <strong key={index} className="font-semibold text-lime">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
