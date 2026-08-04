"use client";

import type { Platform, ContentType } from "@/lib/embeds";
import TikTokEmbed from "./TikTokEmbed";
import InstagramEmbed from "./InstagramEmbed";
import FacebookEmbed from "./FacebookEmbed";

export default function PlatformEmbed({
  platform,
  url,
  type,
}: {
  platform: Platform;
  url: string;
  type: ContentType;
}) {
  switch (platform) {
    case "tiktok":
      return <TikTokEmbed key={url} url={url} />;
    case "instagram":
      return <InstagramEmbed key={url} url={url} />;
    case "facebook":
      return <FacebookEmbed key={url} url={url} isVideo={type === "video"} />;
    case "ugc":
      return null;
  }
}
