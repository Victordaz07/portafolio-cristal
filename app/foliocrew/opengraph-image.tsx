import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Foliocrew — Tu talento merece su espacio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagen al compartir el link de la página de venta (WhatsApp, Instagram, LinkedIn…).
export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public/brand/logo-claro.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#251023", color: "#FBF7F5", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={logoSrc} height={72} width={295} />
        <div style={{ display: "flex", flexDirection: "column", marginTop: 48, fontSize: 84, lineHeight: 1.05, fontWeight: 700 }}>
          <span>Tu talento merece</span>
          <span style={{ color: "#B692E7", fontStyle: "italic" }}>su espacio.</span>
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 30, color: "rgba(251,247,245,0.75)" }}>
          Portafolio, media kit y colaboraciones para creadoras UGC.
        </div>
        <div style={{ display: "flex", position: "absolute", right: -80, top: 60, width: 380, height: 500, border: "4px solid rgba(182,146,231,0.5)", borderRadius: 48, transform: "rotate(-12deg)" }} />
      </div>
    ),
    size
  );
}
