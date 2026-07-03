/** Trip banner removal input. */
export interface DeleteTripBannerRequestDTO {
  tripId: string;
  /** Authenticated user email — used to authorize by "trip owner". */
  userEmail: string;
}
