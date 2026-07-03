/** Activity banner upload input — raw image bytes plus the caller identity. */
export interface UploadActivityBannerRequestDTO {
  tripId: string;
  activityId: string;
  /** Authenticated user id — used to authorize by "activity creator". */
  userId: string;
  /** Authenticated user email — used to authorize by "trip owner". */
  userEmail: string;
  fileBuffer: Buffer;
}
