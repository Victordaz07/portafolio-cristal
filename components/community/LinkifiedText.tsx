import { splitLinks } from "@/lib/community";

/** Texto de la comunidad: respeta saltos de línea y convierte las URLs en enlaces (nunca HTML). */
export default function LinkifiedText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <p className={`whitespace-pre-line break-words ${className}`}>
      {splitLinks(text).map((part, i) =>
        part.href ? (
          <a key={i} href={part.href} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-coral underline-offset-2 hover:underline">
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </p>
  );
}
