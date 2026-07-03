import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { canManageActivity } from "../activityAuthorization";
import { DeleteActivityRequestDTO } from "./DeleteActivityRequestDTO";
import { DeleteActivityResponseDTO } from "./DeleteActivityResponseDTO";

/**
 * Contract: `DELETE /trips/{id}/activities/{activityId}` (soft delete).
 *
 * - 404 when the trip is missing, the activity is missing, or the activity
 *   belongs to another trip.
 * - 403 when the caller is neither the activity creator nor the trip owner.
 */
export class DeleteActivityUseCase
  implements IUseCase<DeleteActivityRequestDTO, DeleteActivityResponseDTO>
{
  constructor(private readonly tripRepo: ITripContractRepo) {}

  async execute(
    request: DeleteActivityRequestDTO
  ): Promise<Result<DeleteActivityResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const activity = await this.tripRepo.findActivity(request.tripId, request.activityId);
    if (!activity) {
      return Result.fail(AppError.notFound("Atividade não encontrada"));
    }

    if (!canManageActivity(trip, activity, request.userId, request.userEmail)) {
      return Result.fail(
        AppError.forbidden("Você não tem permissão para excluir esta atividade")
      );
    }

    await this.tripRepo.softDeleteActivity(activity.id);

    return Result.ok();
  }
}
