export interface AddActivityLinkRequestDTO {
  tripId: string;
  activityId: string;
  /** Authenticated user id — authorizes "is the activity creator". */
  userId: string;
  /** Authenticated user email — authorizes "is the trip owner". */
  userEmail: string;
  label: string;
  /** Validated (http/https only) at the presentation layer. */
  url: string;
}
