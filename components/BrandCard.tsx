export interface BrandCardProps {
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
}

const cardClass =
  "flex h-24 w-32 shrink-0 items-center justify-center rounded-2xl border border-line bg-white p-sp-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-lime/60 hover:shadow-md";

export default function BrandCard({ name, logoUrl, websiteUrl }: BrandCardProps) {
  const content = logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={name} className="max-h-10 w-auto object-contain" />
  ) : (
    <span className="text-center text-sm font-medium text-ink">{name}</span>
  );

  if (websiteUrl) {
    return (
      <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className={cardClass}>
        {content}
      </a>
    );
  }

  return <div className={cardClass}>{content}</div>;
}
