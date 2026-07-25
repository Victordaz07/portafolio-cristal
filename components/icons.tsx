export function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11 2.5a1 1 0 0 1 1.94 0l1.2 4.66a5 5 0 0 0 3.6 3.6l4.66 1.2a1 1 0 0 1 0 1.94l-4.66 1.2a5 5 0 0 0-3.6 3.6l-1.2 4.66a1 1 0 0 1-1.94 0l-1.2-4.66a5 5 0 0 0-3.6-3.6l-4.66-1.2a1 1 0 0 1 0-1.94l4.66-1.2a5 5 0 0 0 3.6-3.6Z" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.8 8.6a4.6 4.6 0 0 0-7.85-3.25L12 6.3l-.95-.95A4.6 4.6 0 0 0 3.2 8.6c0 1.2.47 2.36 1.35 3.25L12 19.5l7.45-7.65a4.58 4.58 0 0 0 1.35-3.25Z" />
    </svg>
  );
}

export function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m12 2.5 2.9 6.2 6.6.75-4.9 4.6 1.3 6.65L12 17.6l-5.9 3.1 1.3-6.65-4.9-4.6 6.6-.75Z" />
    </svg>
  );
}

export function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 5h16v11H8.5L4 19.5Z" />
    </svg>
  );
}

export const STAT_ICONS = {
  heart: HeartIcon,
  star: StarIcon,
  chat: ChatIcon,
} as const;

export type StatIconKey = keyof typeof STAT_ICONS;

export const STAT_ICON_OPTIONS: { value: StatIconKey; label: string }[] = [
  { value: "heart", label: "Corazón" },
  { value: "star", label: "Estrella" },
  { value: "chat", label: "Chat" },
];
