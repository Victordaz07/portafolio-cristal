export interface BrandChipProps {
  name: string;
  logoUrl?: string | null;
}

export default function BrandChip({ name, logoUrl }: BrandChipProps) {
  return (
    <span className="flex items-center gap-sp-2 rounded-full border border-sage bg-white px-sp-4 py-sp-2">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="h-5 w-auto object-contain" />
      ) : (
        <span className="text-sm font-medium text-ink">{name}</span>
      )}
    </span>
  );
}
