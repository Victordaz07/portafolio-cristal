import { StarFilledIcon } from "@/components/icons";

export default function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-sp-1" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarFilledIcon
          key={index}
          className={`h-4 w-4 ${index < rating ? "text-coral" : "text-ink/15"}`}
        />
      ))}
    </div>
  );
}
