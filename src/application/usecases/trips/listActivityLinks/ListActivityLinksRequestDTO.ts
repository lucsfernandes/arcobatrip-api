export interface ListActivityLinksRequestDTO {
  tripId: string;
  activityId: string;
  /** Authenticated user email — used to authorize "is a participant". */
  userEmail: string;
}
