export interface PackageCardProps {
  emoji: string;
  name: string;
  items: string[];
}

export default function PackageCard({ emoji, name, items }: PackageCardProps) {
  return (
    <div className="flex flex-col rounded-md border border-line bg-white p-sp-5">
      <span className="self-start rounded-full bg-lime/30 px-sp-4 py-sp-2 font-bodoni italic font-bold text-ink">
        {emoji} {name}
      </span>
      <ul className="mt-sp-5 flex flex-col gap-sp-2 text-sm text-ink/70">
        {items.map((item, index) => (
          <li key={index} className="flex gap-sp-2">
            <span className="text-coral">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
