import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { canManageActivity } from "../activityAuthorization";
import { DeleteActivityLinkRequestDTO } from "./DeleteActivityLinkRequestDTO";

/**
 * Contract: `DELETE /trips/{id}/activities/{activityId}/links/{linkId}`
 * (soft delete).
 *
 * - 404 when the trip/activity/link is missing or is not on this chain.
 * - 403 when the caller is neither the activity creator nor the trip owner.
 */
export class DeleteActivityLinkUseCase
  implements IUseCase<DeleteActivityLinkRequestDTO, void>
{
  constructor(private readonly tripRepo: ITripContractRepo) {}

  async execute(request: DeleteActivityLinkRequestDTO): Promise<Result<void>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const activity = await this.tripRepo.findActivity(request.tripId, request.activityId);
    if (!activity) {
      return Result.fail(AppError.notFound("Atividade não encontrada"));
    }

    const link = await this.tripRepo.findActivityLink(request.activityId, request.linkId);
    if (!link) {
      return Result.fail(AppError.notFound("Link não encontrado"));
    }

    if (!canManageActivity(trip, activity, request.userId, request.userEmail)) {
      return Result.fail(
        AppError.forbidden("Você não tem permissão para remover links desta atividade")
      );
    }

    await this.tripRepo.softDeleteLink(link.id);
    return Result.ok();
  }
}
