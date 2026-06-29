import { Notification } from "../../../domain/entities/Notification/notification.entity";
import { NotificationContract, NotificationType } from "../../../application/contracts/contract";

const toContract = (model: Notification): NotificationContract => {
  const notification: NotificationContract = {
    id: model.id,
    type: model.type as NotificationType,
    title: model.title,
    body: model.body,
    at: model.createdAt instanceof Date ? model.createdAt.toISOString() : new Date(model.createdAt).toISOString(),
    read: model.read,
  };
  if (model.tripId) notification.tripId = model.tripId;
  return notification;
};

export const NotificationContractMap = { toContract };
