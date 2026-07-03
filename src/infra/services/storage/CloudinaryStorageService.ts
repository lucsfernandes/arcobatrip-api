import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import {
  IStorageService,
  StoredImage,
  UploadImageOptions,
} from "../../../application/services/storage/IStorageService";
import { env } from "../../../main/config/env";
import logger from "../../../main/logger";

const DEFAULT_FOLDER = "zarpa/avatars";

/**
 * Cloudinary-backed {@link IStorageService}. Credentials come exclusively from
 * env vars (`CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` /
 * `CLOUDINARY_API_SECRET`). When they are absent the service is "not configured":
 * uploads throw a clear error (a real avatar cannot be stored without a backend),
 * while deletes no-op so cleanup paths never break.
 *
 * Images are normalized on upload — 512x512 `fill` crop with `f_auto` / `q_auto`
 * — so the delivered URL is already optimized.
 */
export class CloudinaryStorageService implements IStorageService {
  private readonly configured: boolean;

  constructor() {
    this.configured = Boolean(
      env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
    );

    if (this.configured) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    } else {
      logger.warn(
        "[CloudinaryStorageService] Cloudinary não configurado — uploads de imagem estão desabilitados."
      );
    }
  }

  async uploadImage(buffer: Buffer, options?: UploadImageOptions): Promise<StoredImage> {
    if (!this.configured) {
      throw new Error("Cloudinary não configurado. Upload de imagem indisponível.");
    }

    const folder = options?.folder ?? DEFAULT_FOLDER;

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          overwrite: true,
          transformation: [
            { width: 512, height: 512, crop: "fill", gravity: "auto" },
            { fetch_format: "auto", quality: "auto" },
          ],
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(error ?? new Error("Falha no upload para o Cloudinary"));
            return;
          }
          resolve(uploaded);
        }
      );
      stream.end(buffer);
    });

    return { url: result.secure_url, publicId: result.public_id };
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.configured) {
      return;
    }
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  }
}

/** Singleton instance shared across the application. */
export const storageService = new CloudinaryStorageService();
