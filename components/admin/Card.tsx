import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-line bg-white p-sp-5 shadow-[0_1px_2px_rgba(36,18,39,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
