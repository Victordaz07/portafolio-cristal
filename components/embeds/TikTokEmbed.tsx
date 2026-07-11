"use client";

import { useEffect } from "react";

const SCRIPT_SRC = "https://www.tiktok.com/embed.js";

function reloadScript() {
  // El script de TikTok escanea el DOM al ejecutarse; reinsertarlo
  // fuerza que procese los blockquotes que se agregaron después de la primera carga.
  document.querySelectorAll(`script[src="${SCRIPT_SRC}"]`).forEach((el) => el.remove());
  const script = document.createElement("script");
  script.src = SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
}

export default function TikTokEmbed({ url }: { url: string }) {
  useEffect(() => {
    reloadScript();
  }, [url]);

  return (
    <div className="w-full flex justify-center">
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id=""
        style={{ maxWidth: 605, minWidth: 325 }}
      >
        <section>
          <a href={url} target="_blank" rel="noreferrer">
            Ver en TikTok
          </a>
        </section>
      </blockquote>
    </div>
  );
}
