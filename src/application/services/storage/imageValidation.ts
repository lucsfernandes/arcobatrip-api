/**
 * Real image mimetypes accepted for uploads, inferred from the buffer's magic
 * bytes. The multipart header mimetype is client-supplied and trivially
 * spoofable, so it is NOT trusted — a non-image payload must be rejected before
 * it ever reaches storage.
 */
export const ALLOWED_IMAGE_MIMES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const RIFF = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WEBP = [0x57, 0x45, 0x42, 0x50]; // "WEBP"

function startsWith(buffer: Buffer, signature: number[], offset = 0): boolean {
  if (buffer.length < offset + signature.length) return false;
  return signature.every((byte, i) => buffer[offset + i] === byte);
}

/**
 * Detects the image mimetype from the buffer's magic bytes. Only the formats in
 * {@link ALLOWED_IMAGE_MIMES} are recognised; anything else returns `null`.
 * Implemented in-house (instead of the `file-type` package) because we only need
 * three fixed signatures — fewer dependencies, smaller attack surface.
 */
export function detectImageMime(buffer: Buffer): string | null {
  if (!Buffer.isBuffer(buffer)) return null;
  if (startsWith(buffer, PNG_SIGNATURE)) return "image/png";
  if (startsWith(buffer, JPEG_SIGNATURE)) return "image/jpeg";
  if (startsWith(buffer, RIFF) && startsWith(buffer, WEBP, 8)) return "image/webp";
  return null;
}

/**
 * Returns `true` when the buffer's magic bytes identify a supported image
 * (JPEG/PNG/WebP). Use to gate uploads before touching the storage backend.
 */
export async function isSupportedImageBuffer(buffer: Buffer): Promise<boolean> {
  const mime = detectImageMime(buffer);
  return mime !== null && ALLOWED_IMAGE_MIMES.has(mime);
}
