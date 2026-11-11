export interface RemoveGuestRequestDTO {
  tripId: string;
  guestId: string;
  /** Authenticated user email — only the trip owner may remove guests. */
  userEmail: string;
}
