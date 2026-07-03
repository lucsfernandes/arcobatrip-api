export interface DeleteActivityLinkRequestDTO {
  tripId: string;
  activityId: string;
  linkId: string;
  /** Authenticated user id — authorizes "is the activity creator". */
  userId: string;
  /** Authenticated user email — authorizes "is the trip owner". */
  userEmail: string;
}
