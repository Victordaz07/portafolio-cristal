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
      return <TikTokEmbed url={url} />;
    case "instagram":
      return <InstagramEmbed url={url} />;
    case "facebook":
      return <FacebookEmbed url={url} isVideo={type === "video"} />;
  }
}
