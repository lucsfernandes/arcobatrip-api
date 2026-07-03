export interface DeleteCommentRequestDTO {
  tripId: string;
  activityId: string;
  commentId: string;
  /** Authenticated user id — authorizes "is the author". */
  userId: string;
  /** Authenticated user email — authorizes "is the trip owner". */
  userEmail: string;
}
