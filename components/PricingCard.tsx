"use client";

import { usePackageSelection } from "./PackageSelectionContext";

export interface PricingCardProps {
  name: string;
  price: string;
  unit: string;
  deliverables: string[];
  featured?: boolean;
}

export default function PricingCard({
  name,
  price,
  unit,
  deliverables,
  featured = false,
}: PricingCardProps) {
  const { selectPackage } = usePackageSelection();

  return (
    <div
      className={`relative flex flex-col rounded-lg p-sp-6 ${
        featured ? "bg-cobalt text-cream" : "bg-white text-ink border border-line"
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-sp-5 rounded-full bg-coral px-sp-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
          Más pedido
        </span>
      )}

      <h3 className="font-bodoni italic font-bold uppercase text-xl">{name}</h3>

      <p className="mt-sp-4">
        <span className="font-mono font-bold text-3xl">{price}</span>
        <span className={`ml-1 font-mono text-sm ${featured ? "text-cream/70" : "text-moss"}`}>
          {unit}
        </span>
      </p>

      <ul className="mt-sp-5 flex flex-1 flex-col gap-sp-2">
        {deliverables.map((item) => (
          <li key={item} className="flex items-start gap-sp-2 text-sm">
            <span className={featured ? "text-lime" : "text-coral"} aria-hidden>
              →
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => selectPackage(name)}
        className={`mt-sp-6 rounded-sm py-sp-3 font-medium transition hover:opacity-90 ${
          featured ? "bg-coral text-white" : "bg-cobalt text-cream"
        }`}
      >
        Elegir {name}
      </button>
    </div>
  );
}
