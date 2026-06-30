import * as React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { IEmailService } from "../../../application/services/email/IEmailService";
import { env } from "../../../main/config/env";
import logger from "../../../main/logger";
import {
  NotificationEmail,
  ResetPasswordEmail,
  VerifyEmail,
  WelcomeEmail,
} from "./templates";

/**
 * Resend-backed {@link IEmailService}. All sends are BEST-EFFORT: when no
 * `RESEND_API_KEY` is configured the service logs a warning and no-ops, and any
 * transport failure is caught and logged. Methods never throw to the caller so
 * email delivery can never break the primary request.
 */
export class ResendEmailService implements IEmailService {
  private readonly resend: Resend | null;

  constructor() {
    this.resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  }

  async sendWelcome(to: string, params: { name: string }): Promise<void> {
    const html = await render(React.createElement(WelcomeEmail, params));
    await this.send(to, "Bem-vindo(a) ao Arcobatrip!", html);
  }

  async sendEmailVerification(
    to: string,
    params: { name: string; verifyUrl: string }
  ): Promise<void> {
    const html = await render(React.createElement(VerifyEmail, params));
    await this.send(to, "Confirme seu email no Arcobatrip", html);
  }

  async sendPasswordReset(
    to: string,
    params: { name: string; resetUrl: string }
  ): Promise<void> {
    const html = await render(React.createElement(ResetPasswordEmail, params));
    await this.send(to, "Redefinição de senha do Arcobatrip", html);
  }

  async sendNotification(
    to: string,
    params: { name: string; title: string; body: string; actionUrl?: string }
  ): Promise<void> {
    const html = await render(React.createElement(NotificationEmail, params));
    await this.send(to, params.title, html);
  }

  /** Low-level send. Swallows and logs every failure — never throws. */
  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      logger.warn(
        `[ResendEmailService] RESEND_API_KEY não configurada — email "${subject}" para ${to} não foi enviado.`
      );
      return;
    }

    try {
      await this.resend.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });
    } catch (error) {
      logger.error("[ResendEmailService.send]", error);
    }
  }
}

/** Singleton instance shared across the application. */
export const emailService = new ResendEmailService();
