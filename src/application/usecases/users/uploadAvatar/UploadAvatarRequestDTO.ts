/** Avatar upload input — the raw image bytes (validated by multer upstream). */
export interface UploadAvatarRequestDTO {
  userId: string;
  fileBuffer: Buffer;
}
