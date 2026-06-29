import { Notification } from "../../../domain/entities/Notification/notification.entity";
import { NotificationType } from "../../contracts/contract";

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  tripId?: string | null;
}

export interface INotificationRepo {
  findByUser(userId: string): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
  create(data: CreateNotificationData): Promise<Notification>;
  markRead(notification: Notification): Promise<Notification>;
  markAllRead(userId: string): Promise<Notification[]>;
}
