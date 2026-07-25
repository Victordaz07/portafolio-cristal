import { QuoteIcon } from "@/components/icons";

export interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  photoUrl?: string | null;
}

export default function TestimonialCard({ quote, name, role, photoUrl }: TestimonialCardProps) {
  return (
    <div className="flex flex-col gap-sp-4 rounded-md border border-line bg-white p-sp-6">
      <QuoteIcon className="h-6 w-6 text-lime" />
      <p className="flex-1 text-ink/80 leading-relaxed">{quote}</p>
      <div className="flex items-center gap-sp-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-cream">
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{name}</p>
          <p className="text-xs text-ink/60">{role}</p>
        </div>
      </div>
    </div>
  );
}
