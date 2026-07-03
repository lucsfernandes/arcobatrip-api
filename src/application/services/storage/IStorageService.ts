/**
 * Object-storage port for user-uploaded images (avatars, later banners). Use
 * cases depend on this intent-level abstraction, never on the concrete provider
 * (Cloudinary), so the storage backend can change without touching the
 * application layer.
 */

/** A stored image: its public delivery URL and the provider handle for deletion. */
export interface StoredImage {
  url: string;
  publicId: string;
}

export interface UploadImageOptions {
  /** Logical folder/namespace, e.g. `"zarpa/avatars"`. */
  folder?: string;
  /**
   * Target dimensions (px) for the normalizing `fill` crop. When omitted the
   * implementation applies its square avatar default (512x512). Banners pass a
   * wide aspect (e.g. 1200x400).
   */
  width?: number;
  height?: number;
}

export interface IStorageService {
  /**
   * Upload an image from an in-memory buffer. Implementations apply resize /
   * optimization (e.g. 512x512 fill, auto format & quality) and return the
   * public URL plus the handle needed to delete it later.
   */
  uploadImage(buffer: Buffer, options?: UploadImageOptions): Promise<StoredImage>;
  /** Delete a previously uploaded image by its provider handle. Idempotent. */
  deleteImage(publicId: string): Promise<void>;
}
