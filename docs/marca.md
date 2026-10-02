# Marca: Vitrina UGC

**Vitrina UGC** es la plataforma: el panel, las páginas legales y lo que ven Meta, TikTok
y Google al revisar las apps. El sitio público de cada creadora (por ahora, el de Cristal)
mantiene su propia identidad.

- **Dominio previsto:** `vitrinaugc.com` (estaba disponible; todavía no se compró).
- **Frase:** "Tu vitrina de contenido UGC".
- **Idea:** una vitrina de tienda (el toldo festoneado) donde lo que se exhibe son videos
  (el botón de play). El contenido de la creadora, puesto en vidriera para las marcas.

## Logo

Los archivos viven en `public/brand/`. Son vectoriales: el texto está convertido a trazos,
así que se ven igual en cualquier lugar.

| Archivo | Uso |
| --- | --- |
| `logo.svg` | Logo horizontal sobre fondos claros (login, documentos). |
| `logo-claro.svg` | Logo horizontal sobre fondos oscuros (sidebar del panel). |
| `isotipo.svg` | Solo el ícono: avatar de redes, favicon, apps. |
| `isotipo-512.png` | El ícono en PNG para subir a las consolas de Meta, TikTok y Google. |
| `app/icon.svg` / `app/apple-icon.png` | Favicon e ícono de iPhone (Next.js los toma solos). |

Reglas:
- No estirar, rotar ni cambiar los colores del logo.
- Dejar alrededor un aire mínimo de la mitad del alto del ícono.
- No usar el isotipo a menos de 16 px.

Para regenerar los SVG (por ejemplo, si cambian los colores), usa el script
`scripts/brand/make_logo.py`. Usa `fonttools` y las fuentes Fraunces Italic 700 y Space Mono 700.

## Colores

| Nombre | Hex | Uso |
| --- | --- | --- |
| Tinta | `#241227` | Texto, fondo del sidebar y del ícono. |
| Crema | `#FBF7F5` | Fondo general. |
| Lila | `#A866BE` | Acento principal: botones, enlaces, el toldo. |
| Morado | `#801F82` | Acento oscuro: hover, detalles. |
| Lavanda | `#C3ACEA` | Acento claro: etiquetas, la franja del toldo. |

Son los mismos colores del panel (`coral`, `moss` y `lime` en Tailwind). El color de
acento del **sitio** de cada creadora se cambia en Apariencia. El de la **marca** Vitrina
UGC es siempre lila.

## Tipografías

- **Fraunces Italic:** títulos y el nombre "vitrina".
- **Space Mono:** etiquetas, la píldora "UGC" y los números.
- **Inter:** texto corrido.

## Voz

Cercana, en español neutro, de tú, sin tecnicismos. Habla como una colega que sabe del
negocio: "Las marcas suelen quedarse con quien contesta primero", no "Tiempo de respuesta
excedido".

## Imágenes con IA (DALL·E / gpt-image)

Las ilustraciones y fotos de marca (imagen para compartir links, login, estados vacíos,
banner de redes, ideas de isotipo) se generan con la API de imágenes de OpenAI:

1. Crea una clave en platform.openai.com → API keys.
2. Ponla como `OPENAI_API_KEY`:
   - en tu `.env` local, o
   - en las variables del entorno de la nube.

   Nunca la pegues en un chat ni la subas a GitHub.
3. Corre `npm run brand:images` (o solo algunas: `npm run brand:images -- og-plataforma`).
4. Las imágenes quedan en `public/brand/ia/`. Revísalas antes de usarlas.

Los textos de cada imagen están en `scripts/brand/prompts.mjs`. El modelo por defecto es
`gpt-image-1`, el sucesor de DALL·E en la misma API. Para usar DALL·E 3, pon
`OPENAI_IMAGE_MODEL=dall-e-3`.

La app no usa esta clave: solo la usa este script.

El logo oficial es el SVG vectorial, no una imagen generada. Las imágenes de IA no salen
nítidas a tamaño pequeño ni se pueden editar como vector. La imagen
`logo-exploracion` sirve solo como inspiración.
