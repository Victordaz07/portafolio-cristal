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
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
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
