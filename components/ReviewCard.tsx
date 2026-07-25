import StarRating from "@/components/StarRating";

export interface ReviewCardProps {
  photoUrl?: string | null;
  category: string;
  title: string;
  description: string;
  rating: number;
}

export default function ReviewCard({ photoUrl, category, title, description, rating }: ReviewCardProps) {
  return (
    <div className="flex items-center gap-sp-5 rounded-md border border-line bg-white p-sp-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-cream">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={title} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-block rounded-full bg-lime/25 px-sp-3 py-1 font-mono text-[10px] uppercase tracking-wide text-moss">
          {category}
        </span>
        <p className="mt-sp-2 font-bodoni italic font-bold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink/70">{description}</p>
        <div className="mt-sp-2">
          <StarRating rating={rating} />
        </div>
      </div>
    </div>
  );
}
