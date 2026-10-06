import Link from "next/link";
import CommunityAvatar from "./CommunityAvatar";
import { levelLabel } from "@/lib/community";
import type { AdminLang } from "@/lib/admin-lang";

export interface Author {
  displayName: string;
  avatarUrl: string | null;
  reputation: number;
  creator: { slug: string };
}

/** Foto, nombre, @usuario y nivel de quien publica o responde. */
export default function AuthorBadge({ author, lang, meta, size = 36 }: { author: Author; lang: AdminLang; meta?: string; size?: number }) {
  return (
    <Link href={`/admin/comunidad/creador/${author.creator.slug}`} className="group flex min-w-0 items-center gap-sp-2">
      <CommunityAvatar name={author.displayName} url={author.avatarUrl} size={size} />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-sp-2 text-sm">
          <span className="truncate font-semibold text-ink group-hover:text-coral">{author.displayName}</span>
          <span className="rounded-full bg-cream px-[7px] py-px font-mono text-[10px] uppercase text-ink/60">{levelLabel(author.reputation, lang)}</span>
        </span>
        <span className="block truncate text-xs text-ink/50">
          @{author.creator.slug}
          {meta ? ` · ${meta}` : ""}
        </span>
      </span>
    </Link>
  );
}
