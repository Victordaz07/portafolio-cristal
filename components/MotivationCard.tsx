"use client";

import { HeartIcon, SparkleIcon } from "@/components/icons";

export default function MotivationCard({
  phrase,
  onClose,
}: {
  phrase: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-sp-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xs rounded-[48px_48px_28px_28px/60px_60px_24px_24px] border border-lime/40 bg-gradient-to-b from-white to-cream px-sp-7 py-sp-8 text-center shadow-2xl"
      >
        <HeartIcon className="absolute -left-3 -top-3 h-6 w-6 -rotate-12 text-coral/70" />
        <HeartIcon className="absolute -right-2 top-8 h-4 w-4 rotate-12 text-lime" />
        <HeartIcon className="absolute -bottom-3 left-8 h-4 w-4 rotate-6 text-coral/50" />
        <SparkleIcon className="absolute -right-3 -bottom-3 h-6 w-6 text-lime" />

        <SparkleIcon className="mx-auto h-5 w-5 text-lime" />
        <p className="mt-sp-4 font-fraunces italic text-lg leading-snug text-ink">{phrase}</p>
        <HeartIcon className="mx-auto mt-sp-5 h-4 w-4 text-coral" />
      </div>
    </div>
  );
}
