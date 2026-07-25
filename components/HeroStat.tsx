import { STAT_ICONS, StarIcon, type StatIconKey } from "@/components/icons";

export interface HeroStatProps {
  value: string;
  label: string;
  icon: string;
}

export default function HeroStat({ value, label, icon }: HeroStatProps) {
  const Icon = STAT_ICONS[icon as StatIconKey] ?? StarIcon;

  return (
    <div className="flex items-start gap-sp-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/15 text-coral">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="font-mono text-xl font-bold text-ink">{value}</p>
        <p className="mt-sp-1 font-sans text-[11px] uppercase leading-tight tracking-wide text-ink/60">
          {label}
        </p>
      </div>
    </div>
  );
}
