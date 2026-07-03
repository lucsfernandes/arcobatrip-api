export interface AddGuestRequestDTO {
  tripId: string;
  email: string;
  /**
   * Optional display name. When absent/blank it is derived from the email
   * local-part, capitalized (`"ana.souza"` → `"Ana Souza"`).
   */
  name?: string;
}
