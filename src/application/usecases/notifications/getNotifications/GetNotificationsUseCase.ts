import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { INotificationRepo } from "../INotificationRepo";
import { GetNotificationsRequestDTO } from "./GetNotificationsRequestDTO";
import { GetNotificationsResponseDTO } from "./GetNotificationsResponseDTO";
import { NotificationContractMap } from "../../../../infra/db/mappers/NotificationContractMap";

/** Contract: `GET /notifications`. Current user's notifications, newest first. */
export class GetNotificationsUseCase
  implements IUseCase<GetNotificationsRequestDTO, GetNotificationsResponseDTO>
{
  constructor(private readonly notificationRepo: INotificationRepo) {}

  async execute(
    request: GetNotificationsRequestDTO
  ): Promise<Result<GetNotificationsResponseDTO>> {
    const notifications = await this.notificationRepo.findByUser(request.userId);
    return Result.ok(notifications.map(NotificationContractMap.toContract));
  }
}
