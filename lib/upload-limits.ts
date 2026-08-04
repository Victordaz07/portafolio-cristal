export const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 40 * 1024 * 1024;

export function formatMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}
