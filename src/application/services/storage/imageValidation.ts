import { fromBuffer } from "file-type";

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

/**
 * Returns `true` when the buffer's magic bytes identify a supported image
 * (JPEG/PNG/WebP). Use to gate uploads before touching the storage backend.
 */
export async function isSupportedImageBuffer(buffer: Buffer): Promise<boolean> {
  const detected = await fromBuffer(buffer);
  return !!detected && ALLOWED_IMAGE_MIMES.has(detected.mime);
}
