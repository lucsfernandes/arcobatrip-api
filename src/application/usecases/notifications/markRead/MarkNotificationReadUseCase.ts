import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { INotificationRepo } from "../INotificationRepo";
import { MarkNotificationReadRequestDTO } from "./MarkNotificationReadRequestDTO";
import { MarkNotificationReadResponseDTO } from "./MarkNotificationReadResponseDTO";
import { NotificationContractMap } from "../../../../infra/db/mappers/NotificationContractMap";

/**
 * Contract: `PATCH /notifications/{id}/read`. 404 when the notification does not
 * exist or is not owned by the current user.
 */
export class MarkNotificationReadUseCase
  implements IUseCase<MarkNotificationReadRequestDTO, MarkNotificationReadResponseDTO>
{
  constructor(private readonly notificationRepo: INotificationRepo) {}

  async execute(
    request: MarkNotificationReadRequestDTO
  ): Promise<Result<MarkNotificationReadResponseDTO>> {
    const notification = await this.notificationRepo.findById(request.notificationId);
    if (!notification || notification.userId !== request.userId) {
      return Result.fail(AppError.notFound("Notificação não encontrada"));
    }

    const updated = await this.notificationRepo.markRead(notification);
    return Result.ok(NotificationContractMap.toContract(updated));
  }
}
