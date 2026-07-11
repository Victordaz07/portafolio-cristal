export interface StatCardProps {
  value: string;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="border-t-[3px] border-sage bg-white rounded-md px-sp-5 py-sp-6">
      <p className="font-mono font-bold text-3xl text-moss">{value}</p>
      <p className="mt-sp-2 font-sans text-xs uppercase tracking-wide text-ink/70">{label}</p>
    </div>
  );
}
