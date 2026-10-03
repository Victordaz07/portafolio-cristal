// Genera el blob recortado a partir del área que devuelve react-easy-crop (onCropComplete).
// Se usa tanto para fotos nuevas (File → object URL) como para volver a recortar una ya subida (su URL).

// Formas de encuadre para logos (components/admin/ImageUploadField.tsx): como el logo se
// muestra siempre completo ("object-contain", nunca recortado de verdad en el sitio), esto
// solo ayuda a centrarlo y quitar espacio sobrante antes de subirlo.
export const LOGO_ASPECT_OPTIONS = [
  { label: "Horizontal", value: 2 },
  { label: "Cuadrado", value: 1 },
  { label: "Vertical", value: 0.5 },
];

const MAX_OUTPUT_SIDE = 2000;

/**
 * Formato del recorte: las fotos van en JPG (pesan poco); si la original puede tener
 * transparencia (PNG/WebP/GIF, típico de logos) va en WebP, que la conserva — en JPG
 * el fondo transparente saldría negro.
 */
export function cropMimeFor(source: File | string | null, forcePng = false): string {
  if (forcePng) return "image/webp";
  if (!source) return "image/jpeg";
  const type = typeof source === "string" ? "" : source.type;
  const name = typeof source === "string" ? source.split("?")[0] : source.name;
  return /png|webp|gif/i.test(type) || /\.(png|webp|gif)$/i.test(name) ? "image/webp" : "image/jpeg";
}

export function extensionFor(blob: Blob): string {
  return blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
}

// Foto de portada: según la portada elegida en el Estudio se ve vertical (dividida, revista)
// u horizontal (a pantalla completa), así que se deja elegir la forma.
export const HERO_PHOTO_ASPECT_OPTIONS = [
  { label: "Vertical 4:5", value: 4 / 5 },
  { label: "Horizontal 16:9", value: 16 / 9 },
  { label: "Cuadrada", value: 1 },
];

// Imagen de un enlace del Link en bio: miniatura cuadrada o franja horizontal ("Fila a todo el ancho").
export const LINK_IMAGE_ASPECT_OPTIONS = [
  { label: "Cuadrada", value: 1 },
  { label: "Horizontal", value: 3 },
];

export interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen para recortarla"));
    image.src = src;
  });
}

export async function getCroppedImageBlob(
  imageSrc: string,
  area: CroppedAreaPixels,
  mimeType: string,
  quality = 0.92
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  // Las fotos del celular pueden medir 4000+ px: se limita el lado largo para que el recorte no pese más que el original.
  const scale = Math.min(1, MAX_OUTPUT_SIDE / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar el recorte");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen recortada"))),
      mimeType,
      quality
    );
  });
}
