export interface CreateTripContractRequestDTO {
  /** The authenticated user, who becomes the trip host. */
  userId: string;
  destination: string;
  /** ISO date "YYYY-MM-DD". */
  startDate: string;
  /** ISO date "YYYY-MM-DD". */
  endDate: string;
  /** Emails invited during the wizard; each becomes a pending guest. */
  guestEmails: string[];
}
