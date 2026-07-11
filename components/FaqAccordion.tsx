"use client";

import { useState } from "react";

export interface FaqAccordionItem {
  id: string;
  question: string;
  answer: string;
}

function FaqRow({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-line py-sp-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-sp-4 text-left"
      >
        <span className="font-medium text-ink">{question}</span>
        <span
          className="shrink-0 font-mono text-xl text-coral transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: open ? "300px" : "0px" }}
      >
        <p className="pt-sp-3 text-sm text-ink/70">{answer}</p>
      </div>
    </div>
  );
}

export default function FaqAccordion({ items }: { items: FaqAccordionItem[] }) {
  return (
    <div>
      {items.map((item) => (
        <FaqRow key={item.id} question={item.question} answer={item.answer} />
      ))}
    </div>
  );
}
