/** Confirm the pending phone number with the emailed 6-digit code. */
export interface VerifyPhoneRequestDTO {
  userId: string;
  code: string;
}
