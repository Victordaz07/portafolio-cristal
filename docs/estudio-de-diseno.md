# Estudio de diseño y Link en bio

## Estudio de diseño (`/admin/apariencia`)
Cada perfil elige entre **opciones cerradas** (nunca CSS libre), así ningún sitio queda roto o ilegible.
Todo vive en `lib/design.ts` y se guarda en `SiteSettings`:

| Opción | Campo | Valores |
|---|---|---|
| Estilo | `themeStyle` | editorial (original), minimal, noche, soft, bold |
| Tipografía | `fontPair` | editorial, elegante, moderna, clasica, divertida, impacto |
| Acento | `accentColor` + `customAccent` | 6 paletas o `custom` con un `#RRGGBB` |
| Portada | `heroLayout` | split (original), cover, centered, magazine |
| Bordes | `corners` | recto, suave (original), redondo |
| Fondo | `background` | liso, textura (original), degradado |
| Secciones | `sectionLayout` | `[{ id, hidden }]` en orden (portada arriba y contacto abajo, fijos) |

**Cómo funciona:** los colores base de Tailwind (`cream`, `ink`, `cobalt`, `surface`, `line`) son variables CSS con los
valores originales en `:root`. `components/site/SiteFrame.tsx` las cambia **solo en el sitio público**; el panel no se ve afectado
(salvo el color de acento, que también usa el panel). Las tipografías se cargan con `next/font` sin precarga: el navegador
descarga solo las del sitio que está viendo. Los títulos usan `.site-heading` / `.site-title` y los bordes `.r-*` (escalados).

- **Color propio:** `paletteFromHex` calcula el tono oscuro y el claro, y oscurece el acento hasta que el texto blanco de los
  botones tenga contraste ≥ 3.5:1.
- **Vista previa en vivo:** el iframe carga el sitio real con `?disenio=<base64url>`; `parseDesign` descarta cualquier valor
  que no sea una opción válida y nada se guarda hasta "Guardar diseño".
- **Diséñalo por mí:** `POST /api/admin/design/suggest`. Con `ANTHROPIC_API_KEY`, Claude elige entre las opciones (salida
  estructurada con enums); sin clave o si falla, una propuesta por nicho (`fallbackDesign`).
- **Imagen para compartir:** `/api/og` (1200×630) con nombre, nicho, foto y colores del diseño; la declaran `og:image` y `twitter:image`.

## Link en bio (`/enlaces`, panel en `/admin/enlaces`)
Página corta para la bio de Instagram/TikTok según el handoff de diseño (`components/links/LinkInBio.tsx`):
Avatar con anillo en degradado, SocialRow, HeroCard con brillo diagonal (3.6 s), SectionDivider, LinkCard (fila o tarjeta),
Pill y ES/EN. Entrada escalonada (fade + 12 px, 450 ms, +60 ms por tarjeta desde los 300 ms) y toque `scale(0.97)`;
todo se apaga con "reducir movimiento". Usa el mismo diseño del sitio (estilo, acento, tipografía, bordes).

Sale sola: foto, nombre, nicho, bio, redes, portafolio, media kit, contacto, WhatsApp/correo y 4 publicaciones del Feed.
Más los enlaces propios (`BioLink`: título ES/EN, URL `https://` o `mailto:`, imagen, etiqueta, fila o tarjeta; máx. 30).
