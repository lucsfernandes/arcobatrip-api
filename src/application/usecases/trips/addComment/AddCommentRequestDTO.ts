export interface AddCommentRequestDTO {
  tripId: string;
  activityId: string;
  /** Authenticated user id — persisted as the comment author. */
  userId: string;
  /** Authenticated user email — used to authorize "is a participant". */
  userEmail: string;
  body: string;
}
