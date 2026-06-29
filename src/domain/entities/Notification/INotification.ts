import { NotificationType } from "../../../application/contracts/contract";

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  tripId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
