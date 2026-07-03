/** Activity banner removal input. */
export interface DeleteActivityBannerRequestDTO {
  tripId: string;
  activityId: string;
  /** Authenticated user id — used to authorize by "activity creator". */
  userId: string;
  /** Authenticated user email — used to authorize by "trip owner". */
  userEmail: string;
}
