/** Set/update the phone number and trigger a verification code by email. */
export interface RequestPhoneVerificationRequestDTO {
  userId: string;
  phoneNumber: string;
}
