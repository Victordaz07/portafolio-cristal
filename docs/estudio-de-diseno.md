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

## Link en bio (`/links` y `/enlaces`, panel en `/admin/enlaces`)
Página corta para la bio de Instagram/TikTok según el handoff de diseño (`components/links/LinkInBio.tsx`):
Avatar con anillo en degradado, SocialRow, HeroCard con brillo diagonal (3.6 s), SectionDivider, LinkCard (fila o tarjeta),
Pill y ES/EN. Entrada escalonada (fade + 12 px, 450 ms, +60 ms por tarjeta desde los 300 ms) y toque `scale(0.97)`;
todo se apaga con "reducir movimiento". Usa el mismo diseño del sitio (estilo, acento, tipografía, bordes).

Sale sola: foto, nombre, nicho, bio, redes, portafolio, media kit, contacto, WhatsApp/correo y 4 publicaciones del Feed.
Más los enlaces propios (`BioLink`: título ES/EN, URL `https://` o `mailto:`, imagen, etiqueta, fila o tarjeta; máx. 30).

### Versión 2 (diseño "Crislia Links")
- **Grupos**: cada enlace tiene `section`/`sectionEn` ("Colabora conmigo", "Mis favoritos", "Más"); se muestran en el orden
  de los enlaces, con divisor ondulado y título en la tipografía de títulos.
- **Tarjetas**: `kicker` (palabra de acción: "Comprar", "Únete"), `badge` en el acento ("Abierto ahora"), `pill` de descuento
  ("15% OFF"). Sin imagen, el ícono sale del tipo de enlace (PayPal, tienda, redes, correo, WhatsApp).
- **Clics**: `POST /api/links/click` (sendBeacon, 1 por enlace por minuto por IP, solo enlaces de la cuenta del sitio).
  El más visitado con 10+ clics lleva "Más clics" si no tiene otra etiqueta. El panel muestra los clics.
- **Fondo decorativo** (en el Estudio de diseño, `SiteSettings.linksPattern`): blobs difuminados (por defecto), acuarela,
  punteado, pétalos, ramitas o enredadera; los patrones son SVG usados como máscara, pintados con el acento al 15%.
- **Acentos**: los 6 presets usan los hex del handoff (`ring` = anillo del avatar, `light` = eyebrow, `dark` = sólido);
  el tono de botones con texto blanco se mantiene con contraste ≥ 3.5:1.
- Frase bajo el nombre (`linksTagline`), "Copiar mi enlace", y bloques automáticos que se pueden apagar
  (`linksShowBrandKit`, `linksShowRecent`). `content-visibility:auto` en las tarjetas.
