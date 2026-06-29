import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { INotificationRepo } from "../INotificationRepo";
import { MarkAllNotificationsReadRequestDTO } from "./MarkAllNotificationsReadRequestDTO";
import { MarkAllNotificationsReadResponseDTO } from "./MarkAllNotificationsReadResponseDTO";
import { NotificationContractMap } from "../../../../infra/db/mappers/NotificationContractMap";

/** Contract: `POST /notifications/read-all`. Marks all as read, returns the list. */
export class MarkAllNotificationsReadUseCase
  implements IUseCase<MarkAllNotificationsReadRequestDTO, MarkAllNotificationsReadResponseDTO>
{
  constructor(private readonly notificationRepo: INotificationRepo) {}

  async execute(
    request: MarkAllNotificationsReadRequestDTO
  ): Promise<Result<MarkAllNotificationsReadResponseDTO>> {
    const notifications = await this.notificationRepo.markAllRead(request.userId);
    return Result.ok(notifications.map(NotificationContractMap.toContract));
  }
}
