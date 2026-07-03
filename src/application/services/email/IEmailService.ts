/**
 * Transactional email port. Use cases depend on these semantic methods (intent)
 * rather than on the transport (Resend), so the delivery mechanism can change
 * without touching the application layer. Implementations MUST be best-effort:
 * a failed send is logged and swallowed — it must never throw to the caller.
 */
export interface IEmailService {
  sendWelcome(to: string, params: { name: string }): Promise<void>;
  sendEmailVerification(to: string, params: { name: string; verifyUrl: string }): Promise<void>;
  sendPasswordReset(to: string, params: { name: string; resetUrl: string }): Promise<void>;
  /** 6-digit code that verifies the user's phone number (delivered by email). */
  sendPhoneVerificationCode(
    to: string,
    params: { name: string; code: string; ttlMinutes: number }
  ): Promise<void>;
  sendNotification(
    to: string,
    params: { name: string; title: string; body: string; actionUrl?: string }
  ): Promise<void>;
}
