import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { isTripParticipant } from "../tripAuthorization";
import { ActivityCommentContractMap } from "../../../../infra/db/mappers/ActivityCommentContractMap";
import { ListCommentsRequestDTO } from "./ListCommentsRequestDTO";
import { ListCommentsResponseDTO } from "./ListCommentsResponseDTO";

/**
 * Contract: `GET /trips/{id}/activities/{activityId}/comments`. Any participant
 * may read. Returns non-deleted comments, oldest first.
 *
 * - 404 when the trip/activity is missing or the activity belongs to another trip.
 * - 403 when the caller is not a participant of the trip.
 */
export class ListCommentsUseCase
  implements IUseCase<ListCommentsRequestDTO, ListCommentsResponseDTO>
{
  constructor(private readonly tripRepo: ITripContractRepo) {}

  async execute(request: ListCommentsRequestDTO): Promise<Result<ListCommentsResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    const activity = await this.tripRepo.findActivity(request.tripId, request.activityId);
    if (!activity) {
      return Result.fail(AppError.notFound("Atividade não encontrada"));
    }

    if (!isTripParticipant(trip, request.userEmail)) {
      return Result.fail(
        AppError.forbidden("Apenas participantes da viagem podem ver os comentários")
      );
    }

    const comments = await this.tripRepo.findComments(request.activityId);
    return Result.ok(comments.map(ActivityCommentContractMap.toContract));
  }
}
