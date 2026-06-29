import { DataSource, Repository } from "typeorm";
import {
  CreateNotificationData,
  INotificationRepo,
} from "../../application/usecases/notifications/INotificationRepo";
import { Notification } from "../../domain/entities/Notification/notification.entity";

export class NotificationRepo implements INotificationRepo {
  private notificationRepository: Repository<Notification>;

  constructor(private readonly dataSource: DataSource) {
    this.notificationRepository = dataSource.getRepository(Notification);
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notificationRepository.findOne({ where: { id } });
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      tripId: data.tripId ?? null,
      read: false,
    });
    return this.notificationRepository.save(notification);
  }

  async markRead(notification: Notification): Promise<Notification> {
    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllRead(userId: string): Promise<Notification[]> {
    await this.notificationRepository.update({ userId }, { read: true });
    return this.findByUser(userId);
  }
}
