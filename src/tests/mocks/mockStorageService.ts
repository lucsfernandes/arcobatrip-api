import {
  IStorageService,
  StoredImage,
  UploadImageOptions,
} from "../../application/services/storage/IStorageService";

/** In-memory {@link IStorageService} recording uploads/deletes for assertions. */
export class MockStorageService implements IStorageService {
  public uploads: { buffer: Buffer; folder?: string }[] = [];
  public deleted: string[] = [];
  /** When true, `uploadImage` rejects — to exercise error paths. */
  public failUpload = false;
  /** Set to `false` to behave like a Cloudinary without credentials. */
  public configured = true;
  /** Public ids whose `deleteImage` rejects (the provider is unreachable). */
  public failDeleteFor = new Set<string>();
  private seq = 0;

  async uploadImage(buffer: Buffer, options?: UploadImageOptions): Promise<StoredImage> {
    if (this.failUpload) {
      throw new Error("upload failed");
    }
    this.uploads.push({ buffer, folder: options?.folder });
    const publicId = `zarpa/avatars/asset-${++this.seq}`;
    return { url: `https://cdn.test/${publicId}.jpg`, publicId };
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async deleteImage(publicId: string): Promise<void> {
    if (this.failDeleteFor.has(publicId)) {
      throw new Error("provider unreachable");
    }
    this.deleted.push(publicId);
  }

  clear(): void {
    this.uploads = [];
    this.deleted = [];
    this.failUpload = false;
    this.failDeleteFor.clear();
    this.configured = true;
    this.seq = 0;
  }
}
