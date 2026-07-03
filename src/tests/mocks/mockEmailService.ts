import { IEmailService } from "../../application/services/email/IEmailService";

interface PhoneCodeCall {
  to: string;
  name: string;
  code: string;
  ttlMinutes: number;
}

/** In-memory {@link IEmailService} that records every send for assertions. */
export class MockEmailService implements IEmailService {
  public welcome: { to: string; name: string }[] = [];
  public emailVerifications: { to: string; verifyUrl: string }[] = [];
  public passwordResets: { to: string; resetUrl: string }[] = [];
  public phoneCodes: PhoneCodeCall[] = [];
  public notifications: { to: string; title: string }[] = [];

  async sendWelcome(to: string, params: { name: string }): Promise<void> {
    this.welcome.push({ to, name: params.name });
  }

  async sendEmailVerification(
    to: string,
    params: { name: string; verifyUrl: string }
  ): Promise<void> {
    this.emailVerifications.push({ to, verifyUrl: params.verifyUrl });
  }

  async sendPasswordReset(
    to: string,
    params: { name: string; resetUrl: string }
  ): Promise<void> {
    this.passwordResets.push({ to, resetUrl: params.resetUrl });
  }

  async sendPhoneVerificationCode(
    to: string,
    params: { name: string; code: string; ttlMinutes: number }
  ): Promise<void> {
    this.phoneCodes.push({ to, ...params });
  }

  async sendNotification(
    to: string,
    params: { name: string; title: string; body: string; actionUrl?: string }
  ): Promise<void> {
    this.notifications.push({ to, title: params.title });
  }

  clear(): void {
    this.welcome = [];
    this.emailVerifications = [];
    this.passwordResets = [];
    this.phoneCodes = [];
    this.notifications = [];
  }
}
