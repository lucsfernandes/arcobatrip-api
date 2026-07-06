export interface CreateSettlementRequestDTO {
  tripId: string;
  /** Participant id of the payer. */
  from: string;
  /** Participant id of the receiver. */
  to: string;
  amount: number;
  /** Authenticated caller email (from the token) — must be a trip participant. */
  userEmail: string;
}
