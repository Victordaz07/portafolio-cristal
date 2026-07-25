import { STAT_ICONS, StarIcon, type StatIconKey } from "@/components/icons";

export interface HeroStatCardProps {
  value: string;
  label: string;
  icon: string;
}

export default function HeroStatCard({ value, label, icon }: HeroStatCardProps) {
  const Icon = STAT_ICONS[icon as StatIconKey] ?? StarIcon;

  return (
    <div className="flex flex-col items-center gap-sp-2 rounded-2xl border border-lime/50 px-sp-3 py-sp-4 text-center">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-lime text-lime">
        <Icon className="h-4 w-4" />
      </span>
      <p className="font-mono text-lg font-bold text-ink">{value}</p>
      <p className="font-sans text-[10px] uppercase tracking-wide text-ink/60">{label}</p>
    </div>
  );
}
