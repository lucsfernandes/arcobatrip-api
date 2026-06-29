import { notificationRepo } from "../typeOrmRepoFactory";
import { GetNotificationsUseCase } from "../../../application/usecases/notifications/getNotifications/GetNotificationsUseCase";
import { MarkNotificationReadUseCase } from "../../../application/usecases/notifications/markRead/MarkNotificationReadUseCase";
import { MarkAllNotificationsReadUseCase } from "../../../application/usecases/notifications/markAllRead/MarkAllNotificationsReadUseCase";
import { GetNotificationsController } from "../../../presentation/controllers/Notification/GetNotificationsController";
import { MarkNotificationReadController } from "../../../presentation/controllers/Notification/MarkNotificationReadController";
import { MarkAllNotificationsReadController } from "../../../presentation/controllers/Notification/MarkAllNotificationsReadController";

const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepo);
const markNotificationReadUseCase = new MarkNotificationReadUseCase(notificationRepo);
const markAllNotificationsReadUseCase = new MarkAllNotificationsReadUseCase(notificationRepo);

const getNotificationsController = new GetNotificationsController(getNotificationsUseCase);
const markNotificationReadController = new MarkNotificationReadController(
  markNotificationReadUseCase
);
const markAllNotificationsReadController = new MarkAllNotificationsReadController(
  markAllNotificationsReadUseCase
);

export {
  getNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
};
