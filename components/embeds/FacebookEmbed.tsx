"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    FB?: { XFBML: { parse: () => void } };
  }
}

function loadSdk(appId: string) {
  if (window.FB) {
    window.FB.XFBML.parse();
    return;
  }
  if (!document.getElementById("fb-root")) {
    const root = document.createElement("div");
    root.id = "fb-root";
    document.body.prepend(root);
  }
  if (document.getElementById("facebook-jssdk")) return;
  const script = document.createElement("script");
  script.id = "facebook-jssdk";
  script.async = true;
  script.defer = true;
  script.crossOrigin = "anonymous";
  script.src = `https://connect.facebook.net/es_LA/sdk.js#xfbml=1&version=v19.0&appId=${appId}`;
  document.body.appendChild(script);
}

export default function FacebookEmbed({ url, isVideo }: { url: string; isVideo: boolean }) {
  const appId = process.env.NEXT_PUBLIC_FB_APP_ID;

  useEffect(() => {
    if (!appId) return;
    loadSdk(appId);
  }, [url, appId]);

  if (!appId) {
    return (
      <div className="w-full rounded-sm border border-line bg-cream p-sp-4 text-sm text-moss">
        Falta configurar <code className="font-mono">NEXT_PUBLIC_FB_APP_ID</code> para mostrar
        embeds de Facebook.{" "}
        <a href={url} target="_blank" rel="noreferrer" className="underline">
          Ver publicación
        </a>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      {isVideo ? (
        <div className="fb-video" data-href={url} data-width="500" data-show-text="false" />
      ) : (
        <div className="fb-post" data-href={url} data-width="500" />
      )}
    </div>
  );
}
