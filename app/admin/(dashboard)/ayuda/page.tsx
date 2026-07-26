"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import Badge from "@/components/admin/Badge";
import { inputClass, secondaryButtonClass } from "@/lib/admin-ui";
import { MANUAL, SECTION_OPTIONS, type ManualBlock, type GlossaryTerm } from "./manual-content";

type Lang = "es" | "en";
type SectionKey = (typeof SECTION_OPTIONS)[number]["value"];

const HEADER = {
  es: { eyebrow: "Ayuda", title: "Manual de uso", description: "Todo lo que necesitas saber para manejar tu sitio, explicado paso a paso." },
  en: { eyebrow: "Help", title: "User manual", description: "Everything you need to know to run your site, explained step by step." },
};

function Blocks({ blocks, numbered = false }: { blocks: ManualBlock[]; numbered?: boolean }) {
  return (
    <div className="flex flex-col gap-sp-6">
      {blocks.map((block, index) => (
        <div key={index} className="flex gap-sp-4">
          {numbered && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime/25 font-mono text-xs font-bold text-coral">
              {index + 1}
            </span>
          )}
          <div className="flex-1">
            <p className="font-fraunces italic text-base text-ink">{block.title}</p>
            {block.paragraphs?.map((p, i) => (
              <p key={i} className="mt-sp-2 text-sm leading-relaxed text-ink/70">
                {p}
              </p>
            ))}
            {block.list && (
              <ul className="mt-sp-2 flex flex-col gap-sp-1 text-sm leading-relaxed text-ink/70">
                {block.list.map((item, i) => (
                  <li key={i} className="flex gap-sp-2">
                    <span className="text-lime">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Glossary({ terms }: { terms: GlossaryTerm[] }) {
  return (
    <div className="grid gap-sp-4 sm:grid-cols-2">
      {terms.map((entry) => (
        <div key={entry.term} className="rounded-md border border-line bg-cream/60 p-sp-4">
          <Badge variant="accent">{entry.term}</Badge>
          <p className="mt-sp-2 text-sm leading-relaxed text-ink/70">{entry.def}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminManualPage() {
  const [lang, setLang] = useState<Lang>("es");
  const [section, setSection] = useState<SectionKey>("primera-vez");
  const content = MANUAL[lang];
  const header = HEADER[lang];

  return (
    <div>
      <PageHeader
        eyebrow={header.eyebrow}
        title={header.title}
        description={header.description}
        action={
          <button
            type="button"
            onClick={() => setLang((l) => (l === "es" ? "en" : "es"))}
            className={secondaryButtonClass}
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
        }
      />

      <label className="mb-sp-5 flex max-w-sm flex-col gap-sp-1.5">
        <span className="font-mono text-xs uppercase tracking-widest text-moss">
          {lang === "es" ? "Ir a la sección" : "Jump to section"}
        </span>
        <select
          value={section}
          onChange={(e) => setSection(e.target.value as SectionKey)}
          className={inputClass}
        >
          {SECTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label[lang]}
            </option>
          ))}
        </select>
      </label>

      <Card>
        {section === "primera-vez" && <Blocks blocks={content.primeraVez} />}
        {section === "glosario" && <Glossary terms={content.glosario} />}
        {section === "reels" && <Blocks blocks={content.reels} numbered />}
        {section === "guia" && <Blocks blocks={content.guia} />}
      </Card>
    </div>
  );
}
