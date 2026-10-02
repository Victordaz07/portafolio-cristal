# Marca: Foliocrew

> Kit completo (identidad, redes, campañas y prompts): [`foliocrew-kit-de-marca.md`](foliocrew-kit-de-marca.md).

**Foliocrew** es la plataforma: el panel, las páginas legales y lo que ven Meta, TikTok y
Google al revisar las apps. El sitio público de cada persona creadora (por ahora, el de Cristal)
mantiene su propia identidad.

- **Nombre:** *folio* (la página de un portafolio) + *crew* (tu equipo, tu comunidad).
- **Dominio:** `foliocrew.pro`, comprado en Hostinger el 2 de octubre de 2026 (vence el 2 de octubre de 2027,
  con renovación automática). `foliocrew.com` ya está tomado.
- **Frases:** "Tu talento merece su espacio." · "Crea. Conecta. Crece."

## Logo

Hecho con ChatGPT y vectorizado con `scripts/brand/vectorize_logo.py`. Ese script separa
los 3 colores del PNG original y los traza con potrace.

| Archivo | Uso |
| --- | --- |
| `public/brand/logo.svg` / `.png` | Logo horizontal sobre fondo claro (login, documentos). |
| `public/brand/logo-claro.svg` / `.png` | Logo horizontal sobre fondo oscuro (sidebar del panel). |
| `public/brand/isotipo.svg` | Solo el ícono, sin fondo. |
| `public/brand/icono-app.svg` | Ícono de app: fondo tinta, páginas crema y lavanda. |
| `public/brand/icono-512.png` | Ícono para las consolas de Meta, TikTok y Google, y foto de perfil. |
| `app/icon.svg` / `app/apple-icon.png` | Favicon e ícono de iPhone (Next.js los toma solos). |
| `public/brand/original/` | Archivos originales de ChatGPT (logo plano, con degradado e ícono oscuro). |
| `public/brand/campana/` | Piezas de campaña: story "Crea. Conecta. Crece." y post "Tu talento merece su espacio". |

Reglas:
- No estirar, rotar ni cambiar los colores.
- Dejar alrededor un aire mínimo del ancho de la "o".
- Tamaño mínimo: el ícono a 16 px y el logo horizontal a 100 px de ancho.

## Colores

| Nombre | Hex | Uso |
| --- | --- | --- |
| Tinta | `#251023` | Texto, fondos oscuros, fondo del ícono. |
| Crema | `#FBF7F5` | Fondo claro. |
| Ciruela | `#7F207B` | Página izquierda del ícono, palabra clave sobre fondo claro. |
| Lavanda | `#B692E7` | Página derecha del ícono, palabra clave sobre fondo oscuro. |

El panel usa casi los mismos tonos (`ink`, `moss`, `lime` en Tailwind). El color de acento
del **sitio** de cada persona creadora se cambia en Apariencia.

## Tipografías

- **Títulos de campaña:** Fraunces, con la palabra clave en itálica.
- **Subtítulos y botones:** Outfit.
- **Texto:** Inter.

## Voz

Cercana, en español neutro, de tú, sin tecnicismos. Habla como una colega que ya vive de
crear contenido: "Las marcas suelen quedarse con quien contesta primero", no "Tiempo de
respuesta excedido".

## Imágenes con IA

Las imágenes de marca se generan con ChatGPT. Los prompts están en la sección 8 del kit.

También se pueden generar desde la terminal con `npm run brand:images`, que usa la API de
imágenes de OpenAI y los prompts de `scripts/brand/prompts.mjs`:
- Necesita `OPENAI_API_KEY` en `.env` o en las variables del entorno. Nunca la pegues en un chat.
- El modelo por defecto es `gpt-image-1`. Para usar DALL·E 3, pon `OPENAI_IMAGE_MODEL=dall-e-3`.
- Las imágenes quedan en `public/brand/ia/`.

La app no usa esta clave: solo la usa el script.
