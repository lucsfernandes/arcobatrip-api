import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { canManageActivity } from "../activityAuthorization";
import { TripLinkContractMap } from "../../../../infra/db/mappers/TripLinkContractMap";
import { AddActivityLinkRequestDTO } from "./AddActivityLinkRequestDTO";
import { AddActivityLinkResponseDTO } from "./AddActivityLinkResponseDTO";

/**
 * Contract: `POST /trips/{id}/activities/{activityId}/links`.
 *
 * - 404 when the trip/activity is missing or the activity belongs to another trip.
 * - 403 when the caller is neither the activity creator nor the trip owner
 *   (same rule as editing the activity — {@link canManageActivity}).
 */
export class AddActivityLinkUseCase
  implements IUseCase<AddActivityLinkRequestDTO, AddActivityLinkResponseDTO>
{
  constructor(private readonly tripRepo: ITripContractRepo) {}

  async execute(
    request: AddActivityLinkRequestDTO
  ): Promise<Result<AddActivityLinkResponseDTO>> {
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
        AppError.forbidden("Você não tem permissão para adicionar links a esta atividade")
      );
    }

    const link = await this.tripRepo.addActivityLink(request.tripId, request.activityId, {
      label: request.label,
      url: request.url,
    });

    return Result.ok(TripLinkContractMap.toContract(link));
  }
}
