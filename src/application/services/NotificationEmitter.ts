import { IUserRepo } from "../usecases/auth/IUserRepo";
import { INotificationRepo } from "../usecases/notifications/INotificationRepo";
import { emailService } from "../../infra/services/email/ResendEmailService";
import logger from "../../main/logger";

/**
 * Domain-event → notification fan-out. Notifications are only ever created for
 * REGISTERED users (resolved by email). Failures here are logged but never
 * propagated so they cannot break the primary write that triggered them.
 */
export class NotificationEmitter {
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly notificationRepo: INotificationRepo
  ) {}

  /** A guest was invited by email → notify that user if they have an account. */
  async invite(invitedEmail: string, tripId: string, destination: string): Promise<void> {
    try {
      const user = await this.userRepo.findByEmail(invitedEmail);
      if (!user) return;
      await this.notificationRepo.create({
        userId: user.id,
        type: "convite",
        title: "Novo convite de viagem",
        body: `Você foi convidado para a viagem para ${destination}.`,
        tripId,
      });
      await emailService.sendNotification(user.email, {
        name: user.fullName,
        title: "Novo convite de viagem",
        body: `Você foi convidado para a viagem para ${destination}.`,
      });
    } catch (error) {
      logger.error("[NotificationEmitter.invite]", error);
    }
  }

  /** A guest confirmed → notify the trip host. */
  async confirmation(
    hostEmail: string,
    guestName: string,
    tripId: string,
    destination: string
  ): Promise<void> {
    try {
      const host = await this.userRepo.findByEmail(hostEmail);
      if (!host) return;
      await this.notificationRepo.create({
        userId: host.id,
        type: "confirmacao",
        title: "Convidado confirmado",
        body: `${guestName} confirmou presença na viagem para ${destination}.`,
        tripId,
      });
      await emailService.sendNotification(host.email, {
        name: host.fullName,
        title: "Convidado confirmado",
        body: `${guestName} confirmou presença na viagem para ${destination}.`,
      });
    } catch (error) {
      logger.error("[NotificationEmitter.confirmation]", error);
    }
  }

  /** An activity was added → notify every registered participant. */
  async activityAdded(
    participantEmails: string[],
    activityTitle: string,
    tripId: string,
    destination: string
  ): Promise<void> {
    await this.fanOut(participantEmails, tripId, {
      type: "atividade",
      title: "Nova atividade no roteiro",
      body: `"${activityTitle}" foi adicionada ao roteiro da viagem para ${destination}.`,
    });
  }

  /** A link was added → notify every registered participant. */
  async linkAdded(
    participantEmails: string[],
    label: string,
    tripId: string,
    destination: string
  ): Promise<void> {
    await this.fanOut(participantEmails, tripId, {
      type: "link",
      title: "Novo link importante",
      body: `O link "${label}" foi adicionado à viagem para ${destination}.`,
    });
  }

  private async fanOut(
    emails: string[],
    tripId: string,
    payload: { type: "atividade" | "link"; title: string; body: string }
  ): Promise<void> {
    const unique = Array.from(new Set(emails));
    for (const email of unique) {
      try {
        const user = await this.userRepo.findByEmail(email);
        if (!user) continue;
        await this.notificationRepo.create({
          userId: user.id,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          tripId,
        });
        await emailService.sendNotification(user.email, {
          name: user.fullName,
          title: payload.title,
          body: payload.body,
        });
      } catch (error) {
        logger.error("[NotificationEmitter.fanOut]", error);
      }
    }
  }
}
