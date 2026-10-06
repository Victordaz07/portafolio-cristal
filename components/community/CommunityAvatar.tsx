/** Foto de perfil de la comunidad (o la inicial si no hay foto). */
export default function CommunityAvatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-coral/20 font-fraunces font-semibold text-coral"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}
