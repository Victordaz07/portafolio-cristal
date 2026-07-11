"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const SCRIPT_SRC = "https://www.instagram.com/embed.js";

function reloadScript() {
  if (window.instgrm) {
    window.instgrm.Embeds.process();
    return;
  }
  document.querySelectorAll(`script[src="${SCRIPT_SRC}"]`).forEach((el) => el.remove());
  const script = document.createElement("script");
  script.src = SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
}

export default function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    reloadScript();
  }, [url]);

  return (
    <div className="w-full flex justify-center">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ maxWidth: 540, minWidth: 326, width: "100%" }}
      >
        <a href={url} target="_blank" rel="noreferrer">
          Ver en Instagram
        </a>
      </blockquote>
    </div>
  );
}
