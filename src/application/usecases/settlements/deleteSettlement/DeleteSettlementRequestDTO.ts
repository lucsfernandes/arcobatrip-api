export interface DeleteSettlementRequestDTO {
  tripId: string;
  settlementId: string;
  /** Authenticated caller email (from the token) — must be a trip participant. */
  userEmail: string;
}
