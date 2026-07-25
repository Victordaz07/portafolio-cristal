export default function TikTokEmbed({ url }: { url: string }) {
  const videoId = url.match(/\/video\/(\d+)/)?.[1] ?? "";

  if (!videoId) {
    return (
      <div className="flex w-full justify-center">
        <a href={url} target="_blank" rel="noreferrer" className="text-moss underline">
          Ver en TikTok
        </a>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center">
      <iframe
        src={`https://www.tiktok.com/embed/v2/${videoId}?autoplay=1`}
        style={{ maxWidth: 605, minWidth: 325, width: "100%", aspectRatio: "9 / 16" }}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="rounded-md border-0"
      />
    </div>
  );
}
