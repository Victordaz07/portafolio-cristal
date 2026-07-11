"use client";

import { useMemo, useState } from "react";
import ContentCard, { type ContentCardProps } from "./ContentCard";

export default function ContentFeed({ cards }: { cards: ContentCardProps[] }) {
  const categories = useMemo(
    () => Array.from(new Set(cards.map((card) => card.category))),
    [cards]
  );
  const pills = ["Todos", ...categories, "Fotos"];
  const [activePill, setActivePill] = useState("Todos");

  const filteredCards = cards.filter((card) => {
    if (activePill === "Todos") return true;
    if (activePill === "Fotos") return card.type === "photo";
    return card.category === activePill;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-sp-2">
        {pills.map((pill) => (
          <button
            key={pill}
            type="button"
            onClick={() => setActivePill(pill)}
            className={`rounded-full border px-sp-4 py-sp-2 font-mono text-xs uppercase tracking-wide transition ${
              activePill === pill
                ? "border-coral bg-coral text-white"
                : "border-line bg-white text-ink hover:border-coral"
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      <div className="mt-sp-6 grid gap-sp-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {filteredCards.map((card, index) => (
          <ContentCard key={`${card.postUrl}-${index}`} {...card} />
        ))}
      </div>
    </div>
  );
}
