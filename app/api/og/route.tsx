import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { designFromSettings, STYLES, type StyleDef } from "@/lib/design";
import { ACCENTS, isAccentId, paletteFromHex } from "@/lib/theme";

export const dynamic = "force-dynamic";

/** Imagen para compartir el sitio (WhatsApp, Instagram, iMessage…) con los colores del Estudio de diseño. */
export async function GET(request: Request) {
  const [hero, settings] = await Promise.all([
    prisma.hero.findFirst({ select: { name: true, niche: true, photoUrl: true, badgeLabel: true } }),
    prisma.siteSettings.findFirst({ select: { accentColor: true, customAccent: true, themeStyle: true, fontPair: true, corners: true, background: true, heroLayout: true, sectionLayout: true } }),
  ]);
  const design = designFromSettings(settings);
  const style: StyleDef = STYLES[design.style];
  const palette =
    design.accent === "custom" && design.customAccent ? paletteFromHex(design.customAccent) : ACCENTS[isAccentId(design.accent) ? design.accent : "lila"];
  const origin = new URL(request.url).origin;
  const photo = hero?.photoUrl ? new URL(hero.photoUrl, origin).toString() : null;
  const radius = design.corners === "recto" ? 6 : design.corners === "redondo" ? 48 : 28;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: style.colors.bg, padding: 56, gap: 56, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 22 }}>
          <div style={{ display: "flex", alignSelf: "flex-start", border: `2px solid ${palette.light}`, color: style.colors.ink, borderRadius: 999, padding: "10px 22px", fontSize: 22, letterSpacing: 3, textTransform: "uppercase" }}>
            {hero?.niche || hero?.badgeLabel || "Creadora UGC"}
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.05, color: style.colors.ink }}>{hero?.name || "Portafolio"}</div>
          <div style={{ display: "flex", fontSize: 30, color: style.colors.ink, opacity: 0.7 }}>Portafolio · Media kit · Colaboraciones</div>
          <div style={{ display: "flex", alignSelf: "flex-start", marginTop: 12, background: palette.accent, color: "#FFFFFF", borderRadius: design.corners === "recto" ? 6 : 999, padding: "16px 34px", fontSize: 28, fontWeight: 700 }}>
            Colaboremos →
          </div>
        </div>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={420} height={518} style={{ objectFit: "cover", borderRadius: radius, border: `6px solid ${palette.light}` }} />
        ) : (
          <div style={{ display: "flex", width: 420, height: 518, borderRadius: radius, background: `linear-gradient(135deg, ${palette.light}, ${palette.accent})` }} />
        )}
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=600, s-maxage=600" } }
  );
}
