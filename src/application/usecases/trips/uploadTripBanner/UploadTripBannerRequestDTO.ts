/** Trip banner upload input — raw image bytes plus the caller identity. */
export interface UploadTripBannerRequestDTO {
  tripId: string;
  /** Authenticated user email — used to authorize by "trip owner". */
  userEmail: string;
  fileBuffer: Buffer;
}
