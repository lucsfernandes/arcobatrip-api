import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { canManageActivity } from "../activityAuthorization";
import { UpdateActivityRequestDTO } from "./UpdateActivityRequestDTO";
import { UpdateActivityResponseDTO } from "./UpdateActivityResponseDTO";
import { ActivityContractMap } from "../../../../infra/db/mappers/ActivityContractMap";

/**
 * Contract: `PATCH /trips/{id}/activities/{activityId}`.
 *
 * - 404 when the trip is missing, the activity is missing, or the activity
 *   belongs to another trip.
 * - 403 when the caller is neither the activity creator nor the trip owner.
 *
 * Mirrors the creation flow (`AddActivityUseCase`), which does NOT validate that
 * `occursAt` falls within the trip date range, so no range check is applied here.
 */
export class UpdateActivityUseCase
  implements IUseCase<UpdateActivityRequestDTO, UpdateActivityResponseDTO>
{
  constructor(private readonly tripRepo: ITripContractRepo) {}

  async execute(
    request: UpdateActivityRequestDTO
  ): Promise<Result<UpdateActivityResponseDTO>> {
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
        AppError.forbidden("Você não tem permissão para editar esta atividade")
      );
    }

    const updated = await this.tripRepo.updateActivity(activity, {
      title: request.title,
      at: request.at,
      status: request.status,
    });

    return Result.ok(ActivityContractMap.toContract(updated));
  }
}
