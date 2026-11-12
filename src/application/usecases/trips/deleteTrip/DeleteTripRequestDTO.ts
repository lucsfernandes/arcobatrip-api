export interface DeleteTripRequestDTO {
  tripId: string;
  /** Authenticated user email — only the trip owner may delete it. */
  userEmail: string;
}
